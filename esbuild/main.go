package main

import (
	"fmt"
	"os"
	"os/signal"
	"seagull/esbuild/config"
	"seagull/esbuild/console"
	"seagull/esbuild/plugins"
	"syscall"

	"github.com/evanw/esbuild/pkg/api"
	"github.com/imdario/mergo"
	"github.com/joho/godotenv"
	"github.com/pborman/getopt/v2"
	"github.com/ttacon/chalk"
)

var modeFlag = getopt.StringLong(
	"mode", 'm', "", "'dev' or 'prod'",
)

func main() {
	godotenv.Load()
	getopt.ParseV2()

	var err error

	var entryPoints = append(
		[]string{},
		"packages/app/entry/bundle.tsx",
		"packages/server/stream.tsx",
		"__esbuild.ts",
	)

	var buildOptions = api.BuildOptions{
		EntryPoints: entryPoints,
		Bundle:      true,
		Splitting:   true,
		// MinifyWhitespace:
		// MinifyIdentifiers:
		// MinifySyntax:
		Color:     api.ColorAlways,
		Format:    api.FormatESModule,
		Sourcemap: api.SourceMapLinked,
		Platform:  api.PlatformBrowser,
		Target:    api.ES2018,
		Write:     true,
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
		AssetNames: "[dir]/[name]",
		ChunkNames: "[dir]/[name][hash]",
		EntryNames: "[dir]/[name]",
	}

	switch *modeFlag {
	case "dev":
		console.Log("Starting dev server")

		var buildOptionsDev = api.BuildOptions{
			MinifyWhitespace:  false,
			MinifyIdentifiers: false,
			MinifySyntax:      false,
			Outdir:            config.BuildRootDev,
			Incremental:       true,
			Plugins: []api.Plugin{
				plugins.Relay(plugins.RelayConfig{Dev: true}),
			},
			Define: map[string]string{
				"process.env.NODE_ENV":         "\"development\"",
				"process.env.GRAPHQL_ENDPOINT": "\"http://localhost:8787/\"",
			},
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
			MinifyWhitespace:  true,
			MinifyIdentifiers: true,
			MinifySyntax:      true,
			Outdir:            config.BuildRootProd,
			Plugins: []api.Plugin{
				plugins.Relay(plugins.RelayConfig{Dev: false}),
			},
			Define: map[string]string{
				"process.env.NODE_ENV": "\"production\"",
				// @todo: add real url
				"process.env.GRAPHQL_ENDPOINT": "\"http://localhost:8787/\"",
			},
		}
		mergo.Merge(&buildOptionsProd, buildOptions)
		var buildResult = api.Build(buildOptionsProd)

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
	default:
		console.Error("Flag '--mode' requires argument 'dev' or 'prod'")
		os.Exit(1)
	}
}
