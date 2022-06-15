package main

import (
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"github.com/evanw/esbuild/pkg/api"
	"github.com/imdario/mergo"
	"github.com/joho/godotenv"
	"github.com/mattn/go-zglob"
	"github.com/pborman/getopt/v2"
	"github.com/ttacon/chalk"

	"lobster/esbuild/cf"
	"lobster/esbuild/config"
	"lobster/esbuild/console"
	"lobster/esbuild/plugins"
)

var uploadFlag = getopt.StringLong(
	"upload", 'u', "", "upload build files to Cloudflare KV",
)
var modeFlag = getopt.StringLong(
	"mode", 'm', "", "'dev' or 'prod'",
)

func main() {
	godotenv.Load()
	getopt.ParseV2()

	var err error

	glob, err := zglob.Glob("public/**/*")
	if err != nil {
		fmt.Println(
			chalk.Red.Color("✘"),
			chalk.White.NewStyle().WithBackground(chalk.Red).Style("[ERROR]"),
			chalk.Reset.WithTextStyle(chalk.Bold).Style("Failed to glob"), chalk.Reset,
		)
		os.Exit(1)
	}

	var entryPoints = append(
		glob,
		"packages/app/bundle.tsx",
		"packages/__esbuild.ts",
		"packages/worker/entry/ssr.tsx",
	)

	var buildOptions = api.BuildOptions{
		EntryPoints: entryPoints,
		Bundle:      true,
		Splitting:   true,
		Color:       api.ColorAlways,
		Format:      api.FormatESModule,
		Sourcemap:   api.SourceMapLinked,
		Platform:    api.PlatformBrowser,
		// @todo: downgrade
		Target: api.ESNext,
		Write:  true,
		// Outdir:
		JSXMode:     api.JSXModeTransform,
		TreeShaking: api.TreeShakingTrue,
		// Plugins:
		// Define:
		Loader: map[string]api.Loader{
			".html": api.LoaderFile,
			".ico":  api.LoaderFile,
			".txt":  api.LoaderFile,
			".png":  api.LoaderFile,
			".jpeg": api.LoaderFile,
			".jpg":  api.LoaderFile,
			".svg":  api.LoaderFile,
		},
		// AssetNames:
		// ChunkNames:
		// EntryNames:
	}

	switch *modeFlag {
	case "dev":
		console.Log("Starting dev server")

		var buildOptionsDev = api.BuildOptions{
			Outdir:      config.BuildRootDev,
			Incremental: true,
			Plugins: []api.Plugin{
				plugins.Relay(plugins.RelayConfig{Dev: true}),
			},
			Define: map[string]string{
				"process.env.NODE_ENV":         "\"development\"",
				"process.env.GRAPHQL_ENDPOINT": "\"http://localhost:8787/\"",
			},
			AssetNames: "[dir]/[name]",
			ChunkNames: "[dir]/[name][hash]",
			EntryNames: "[dir]/[name]",
		}
		mergo.Merge(&buildOptionsDev, buildOptions)

		var sig = make(chan os.Signal, 1)
		var stop = make(chan bool, 1)
		signal.Notify(sig, syscall.SIGTERM, syscall.SIGINT)

		server, err := api.Serve(api.ServeOptions{Port: 3080}, buildOptionsDev)
		if err != nil {
			console.Error("Failed to start server:", err)
			os.Exit(1)
		}
		console.Log(
			"Server running on", chalk.Magenta.Color("http://localhost:3080/"),
		)

		go func() {
			<-sig
			fmt.Println()
			stop <- true
		}()
		<-stop
		server.Stop()
	case "prod":
		console.Log("Bundling for production")
		console.Log("Cleaning build root")

		err = os.RemoveAll(config.BuildRootProd)
		if err != nil {
			console.Error(
				"Could not clean "+config.BuildRootProd+" directory:", err,
			)
		}
		err = os.MkdirAll(config.BuildRootProd, 0777)
		if err != nil {
			console.Error(
				"Could not create"+config.BuildRootProd+"directory:", err,
			)
		}

		var buildOptionsProd = api.BuildOptions{
			Outdir: config.BuildRootProd,
			Plugins: []api.Plugin{
				plugins.Relay(plugins.RelayConfig{Dev: false}),
				plugins.Hash(plugins.HashConfig{
					WorkerPath: "/packages/worker/entry/ssr.js",
				}),
			},
			Define: map[string]string{
				"process.env.NODE_ENV":         "\"production\"",
				"process.env.GRAPHQL_ENDPOINT": "\"https://aegooby.workers.dev/\"",
			},
			AssetNames: "[dir]/[name]@[hash]",
			ChunkNames: "[dir]/[name][hash]@[hash]",
			EntryNames: "[dir]/[name]@[hash]",
		}
		mergo.Merge(&buildOptionsProd, buildOptions)
		buildResult := api.Build(buildOptionsProd)

		if len(buildResult.Warnings) > 0 {
			var messages = api.FormatMessages(buildResult.Warnings,
				api.FormatMessagesOptions{
					Color:         true,
					Kind:          api.ErrorMessage,
					TerminalWidth: 80,
				},
			)
			for _, message := range messages {
				fmt.Print(message)
			}
		}
		if len(buildResult.Errors) > 0 {
			var messages = api.FormatMessages(buildResult.Errors,
				api.FormatMessagesOptions{
					Color:         true,
					Kind:          api.ErrorMessage,
					TerminalWidth: 80,
				},
			)
			for _, message := range messages {
				fmt.Print(message)
			}
			os.Exit(1)
		}

		if *uploadFlag != "" {
			if *uploadFlag != "preview" && *uploadFlag != "live" {
				console.Error(
					"Flag --upload requires argument 'preview' or 'live'",
				)
				os.Exit(1)
			}

			// @todo parallelize
			console.Log("Uploading files to Cloudflare KV")
			cfClient, err := cf.Create(cf.CreateOptions{Destination: *uploadFlag})
			if err != nil {
				console.Error(err)
			}
			err = cf.Upload(&cfClient, cf.CfUploadOptions{
				Exclude: []string{"^/packages/worker/.*"},
			})
			if err != nil {
				console.Error(err)
			}
		}
	default:
		console.Error("Flag '--mode' requires argument 'dev' or 'prod'")
		os.Exit(1)
	}

	console.Success("")
}
