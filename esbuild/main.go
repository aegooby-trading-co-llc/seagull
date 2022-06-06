package main

import (
	"fmt"
	"os"

	"github.com/evanw/esbuild/pkg/api"
)

func main() {
	result := api.Build(api.BuildOptions{
		EntryPoints: []string{"app/index.tsx"},
		Bundle:      true,
		Splitting:   true,
		Color:       api.ColorAlways,
		Format:      api.FormatESModule,
		Sourcemap:   api.SourceMapExternal,
		Target:      api.ES2020,
		Write:       true,
		Outdir:      "build/esbuild",
	})

	if len(result.Errors) > 0 {
		messages := api.FormatMessages(result.Errors, api.FormatMessagesOptions{
			Color:         true,
			Kind:          api.MessageKind(0),
			TerminalWidth: 80,
		})
		for _, message := range messages {
			fmt.Println(message)
		}
		os.Exit(1)
	}
}
