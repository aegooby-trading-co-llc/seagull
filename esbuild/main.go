package main

import (
	"crypto/md5"
	"errors"
	"fmt"
	"io/ioutil"
	"os"
	"regexp"
	"strings"

	"github.com/evanw/esbuild/pkg/api"
	"github.com/graphql-go/graphql/language/ast"
	"github.com/graphql-go/graphql/language/parser"
	"github.com/graphql-go/graphql/language/printer"
)

const Generated = "./__generated__/"

func Replace(
	regex *regexp.Regexp,
	str string,
	repl func([]string) (string, error),
) (string, error) {
	var result = ""
	var lastIndex = 0
	for _, v := range regex.FindAllSubmatchIndex([]byte(str), -1) {
		groups := []string{}
		for i := 0; i < len(v); i += 2 {
			groups = append(groups, str[v[i]:v[i+1]])
		}
		var replResult, err = repl(groups)
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
				var text, err = ioutil.ReadFile(ola.Path)
				if err != nil {
					return api.OnLoadResult{}, err
				}
				var contents = string(text)
				if strings.Contains(contents, "graphql`") {
					var imports = make([]string, 0)
					var regex = regexp.MustCompile("graphql`([\\s\\S]*?)`")
					contents, err = Replace(regex, contents,
						func(strings []string) (string, error) {
							if len(strings) != 2 {
								return "", errors.New("error matching query")
							}
							var query = strings[1]
							var astQuery, err = parser.Parse(parser.ParseParams{
								Source: query,
							})
							if err != nil {
								return "", err
							}
							if len(astQuery.Definitions) == 0 {
								return "", errors.New(
									"unexpected empty GraphQL tag",
								)
							}
							var definition = astQuery.Definitions[0]
							var kind = definition.GetKind()
							if kind != "FragmentDefinition" &&
								kind != "OperationDefinition" {
								return "", errors.New(
									"expected a fragment, mutation, query, or" +
										"subscription, got " + kind,
								)
							}

							var fragment, okFrag = definition.(*ast.FragmentDefinition)
							var operation, okOp = definition.(*ast.OperationDefinition)

							var name string

							if okFrag {
								name = fragment.GetName().Value
								if fragment.GetName() == nil ||
									fragment.GetName().Value == "" {
									return "", errors.New(
										"GraphQL fragments must contain names",
									)
								}
							}
							if okOp {
								name = operation.GetName().Value
								if operation.GetName() == nil ||
									operation.GetName().Value == "" {
									return "", errors.New(
										"GraphQL operations must contain names",
									)
								}
							}

							var definitionStr = fmt.Sprintf(
								"%v", printer.Print(definition),
							)
							var hash = fmt.Sprintf(
								"%x", md5.Sum([]byte(definitionStr)),
							)
							var id = "graphql__" + hash
							var importFile = name + ".graphql.ts"
							var importPath = Generated + importFile
							imports = append(
								imports, "import "+id+" from \""+importPath+"\"",
							)

							// Dev mode
							var errorMessage = "The definition of " + name +
								" appears" + " to have changed. Run relay-" +
								"compiler to update the generated files."
							var devModeCheck = "(" + id + ".hash && " + id +
								".hash !== \"" + hash + "\" && console.error(\"" +
								errorMessage + "\"), " + id + ")"

							return devModeCheck, nil
						})
					if err != nil {
						return api.OnLoadResult{Loader: api.LoaderTSX}, err
					}
					if len(imports) > 0 {
						contents = strings.Join(imports, "\n") + "\n" + contents
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
}
