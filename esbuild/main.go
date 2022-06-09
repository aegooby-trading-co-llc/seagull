package main

import (
	"fmt"
	"os"

	"github.com/evanw/esbuild/pkg/api"
	"github.com/joho/godotenv"
	"github.com/mattn/go-zglob"
	"github.com/pborman/getopt/v2"
	"github.com/ttacon/chalk"

	"lobster/esbuild/cf"
	"lobster/esbuild/config"
	"lobster/esbuild/console"
	"lobster/esbuild/plugins"
)

var uploadFlag = getopt.BoolLong(
	"upload", 'u', "upload build files to Cloudflare KV.",
)

func main() {
	godotenv.Load()
	getopt.ParseV2()

	console.Log("Bundling TypeScript")

	glob, err := zglob.Glob("public/**/*")
	if err != nil {
		fmt.Println(
			chalk.Red.Color("✘"),
			chalk.White.NewStyle().WithBackground(chalk.Red).Style("[ERROR]"),
			chalk.Reset.WithTextStyle(chalk.Bold).Style("Failed to glob"), chalk.Reset,
		)
		os.Exit(1)
	}
	var entryPoints = make([]string, 0)
	entryPoints = append(glob, "app/index.tsx", "worker/index.ts")
	result := api.Build(api.BuildOptions{
		EntryPoints: entryPoints,
		Bundle:      true,
		Splitting:   true,
		Color:       api.ColorAlways,
		Format:      api.FormatESModule,
		Sourcemap:   api.SourceMapExternal,
		Platform:    api.PlatformBrowser,
		Target:      api.ES2020,
		Write:       true,
		Outdir:      config.BuildRoot,
		JSXMode:     api.JSXModeTransform,
		TreeShaking: api.TreeShakingTrue,
		Plugins: []api.Plugin{
			plugins.Relay(plugins.RelayConfig{}),
			plugins.Hash(plugins.HashConfig{WorkerPath: "/worker/index.js"}),
			plugins.CSS(plugins.CSSConfig{}),
		},
		Loader: map[string]api.Loader{
			".html": api.LoaderFile,
			".ico":  api.LoaderFile,
			".txt":  api.LoaderFile,
		},
		AssetNames: "[dir]/[name]@[hash]",
		ChunkNames: "[dir]/[name][hash]@[hash]",
		EntryNames: "[dir]/[name]@[hash]",
	})

	if len(result.Warnings) > 0 {
		var messages = api.FormatMessages(result.Warnings, api.FormatMessagesOptions{
			Color:         true,
			Kind:          api.ErrorMessage,
			TerminalWidth: 80,
		})
		for _, message := range messages {
			fmt.Print(message)
		}
	}
	if len(result.Errors) > 0 {
		var messages = api.FormatMessages(result.Errors, api.FormatMessagesOptions{
			Color:         true,
			Kind:          api.ErrorMessage,
			TerminalWidth: 80,
		})
		for _, message := range messages {
			fmt.Print(message)
		}
		os.Exit(1)
	}

	if *uploadFlag {
		// CLOUDFLARE
		// @todo parallelize
		console.Log("Uploading files to Cloudflare KV")
		cfClient, err := cf.Create()
		if err != nil {
			console.Error(err)
		}
		err = cf.Upload(&cfClient)
		if err != nil {
			console.Error(err)
		}
	}

	console.Success("Done")
}
