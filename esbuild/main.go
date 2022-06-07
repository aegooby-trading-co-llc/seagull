package main

import (
	"errors"
	"fmt"
	"io/ioutil"
	"os"
	"regexp"
	"strings"

	"github.com/evanw/esbuild/pkg/api"
	"github.com/graphql-go/graphql/language/parser"
	"github.com/graphql-go/graphql/language/printer"
)

func Replace(
	regex *regexp.Regexp,
	str string,
	repl func([]string) (string, error),
) (string, error) {
	result := ""
	lastIndex := 0
	for _, v := range regex.FindAllSubmatchIndex([]byte(str), -1) {
		groups := []string{}
		for i := 0; i < len(v); i += 2 {
			groups = append(groups, str[v[i]:v[i+1]])
		}
		replResult, err := repl(groups)
		if err != nil {
			return "", err
		}
		result += str[lastIndex:v[0]] + replResult
		lastIndex = v[1]
	}
	return result + str[lastIndex:], nil
}

func Relay() api.Plugin {
	return api.Plugin{Name: "relay", Setup: func(build api.PluginBuild) {
		build.OnLoad(api.OnLoadOptions{Filter: "\\.tsx$"},
			func(ola api.OnLoadArgs) (api.OnLoadResult, error) {
				text, err := ioutil.ReadFile(ola.Path)
				if err != nil {
					return api.OnLoadResult{}, err
				}
				contents := string(text)
				fmt.Println("Relay plugin")
				if strings.Contains(contents, "graphql`") {
					fmt.Println("Found GraphQL tag")
					// imports := make([]string, 0)
					regex := regexp.MustCompile("graphql`([\\s\\S]*?)`")
					contents, err := Replace(regex, contents, func(strings []string) (string, error) {
						if len(strings) != 2 {
							return "", errors.New("error matching query")
						}
						query := strings[1]
						ast, err := parser.Parse(parser.ParseParams{Source: query})
						if err != nil {
							return "", err
						}
						if len(ast.Definitions) == 0 {
							return "", errors.New("unexpected empty GraphQL tag")
						}
						definition := ast.Definitions[0]
						kind := definition.GetKind()
						if kind != "FragmentDefinition" && kind != "OperationDefinition" {
							return "", errors.New("expected a fragment, mutation, query, or subscription, got " + kind + ".")
						}
						name := definition.GetLoc().Source.Name
						if name == "" {
							return "", errors.New("GraphQL operations and fragments must contain names")
						}
						definitionStr := fmt.Sprintf("%v", printer.Print(definition))
						fmt.Println(definitionStr)
						// md5.Sum([]byte())

						return contents, nil
					})
					if err != nil {
						return api.OnLoadResult{Loader: api.LoaderTSX}, err
					}
					return api.OnLoadResult{Contents: &contents, Loader: api.LoaderTSX}, nil
				} else {
					return api.OnLoadResult{Contents: &contents, Loader: api.LoaderTSX}, nil
				}
			},
		)
	}}
}

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
		Plugins:     []api.Plugin{Relay()},
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
