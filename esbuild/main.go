package main

import (
	"fmt"
	"os"

	"github.com/evanw/esbuild/pkg/api"
)

var plugin = api.Plugin{Name: "relay", Setup: func(build api.PluginBuild) {

}}

func main() {
	result := api.Build(api.BuildOptions{
		EntryPoints: []string{"app/index.tsx"},
		Bundle:      true,
		Splitting:   true,
		Color:       api.ColorAlways,
		Format:      api.FormatESModule,
		Sourcemap:   api.SourceMapExternal,
		Platform:    api.PlatformBrowser,
		Target:      api.ES2020,
		Write:       true,
		Outdir:      "build/esbuild",
		JSXMode:     api.JSXModeTransform,
		TreeShaking: api.TreeShakingTrue,
	})

	if len(result.Warnings) > 0 {
		messages := api.FormatMessages(result.Warnings, api.FormatMessagesOptions{
			Color:         true,
			Kind:          api.ErrorMessage,
			TerminalWidth: 80,
		})
		for _, message := range messages {
			fmt.Print(message)
		}
	}
	if len(result.Errors) > 0 {
		messages := api.FormatMessages(result.Errors, api.FormatMessagesOptions{
			Color:         true,
			Kind:          api.ErrorMessage,
			TerminalWidth: 80,
		})
		for _, message := range messages {
			fmt.Print(message)
		}
		os.Exit(1)
	}
}
