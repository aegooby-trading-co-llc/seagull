package plugins

import (
	"crypto/md5"
	"errors"
	"fmt"
	"io/ioutil"
	"regexp"
	"strings"

	"github.com/evanw/esbuild/pkg/api"
	"github.com/graphql-go/graphql/language/ast"
	"github.com/graphql-go/graphql/language/parser"
	"github.com/graphql-go/graphql/language/printer"
)

const Generated = "./__generated__/"

type RelayConfig struct {
}

func Relay(pluginConfig RelayConfig) api.Plugin {
	return api.Plugin{Name: "relay", Setup: func(build api.PluginBuild) {
		gqlTagRegex, err := regexp.Compile("graphql\\s*`([^`]*)`;")

		build.OnLoad(api.OnLoadOptions{Filter: "\\.tsx$"},
			func(ola api.OnLoadArgs) (api.OnLoadResult, error) {
				if err != nil {
					return api.OnLoadResult{}, err
				}
				file, err := ioutil.ReadFile(ola.Path)
				if err != nil {
					return api.OnLoadResult{}, err
				}
				var contents = string(file)
				if gqlTagRegex.MatchString(contents) {
					var imports = make([]string, 0)
					var err error
					contents = gqlTagRegex.ReplaceAllStringFunc(contents,
						func(str string) string {
							var submatch = gqlTagRegex.FindStringSubmatch(str)
							if len(submatch) != 2 {
								err = errors.New("error matching query")
								return str
							}
							var query = submatch[1]

							var astQuery *ast.Document
							astQuery, err = parser.Parse(parser.ParseParams{
								Source: query,
							})
							if err != nil {
								return str
							}
							if len(astQuery.Definitions) == 0 {
								err = errors.New(
									"unexpected empty GraphQL tag",
								)
								return str
							}
							var definition = astQuery.Definitions[0]
							var kind = definition.GetKind()
							if kind != "FragmentDefinition" &&
								kind != "OperationDefinition" {
								err = errors.New(
									"expected a fragment, mutation, query, or" +
										"subscription, got " + kind,
								)
								return str
							}

							var fragment, okFrag = definition.(*ast.FragmentDefinition)
							var operation, okOp = definition.(*ast.OperationDefinition)

							var name string

							if okFrag {
								name = fragment.GetName().Value
								if fragment.GetName() == nil ||
									fragment.GetName().Value == "" {
									err = errors.New(
										"GraphQL fragments must contain names",
									)
									return str
								}
							}
							if okOp {
								name = operation.GetName().Value
								if operation.GetName() == nil ||
									operation.GetName().Value == "" {
									err = errors.New(
										"GraphQL operations must contain names",
									)
									return str
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

							return devModeCheck
						},
					)
					if err != nil {
						return api.OnLoadResult{Loader: api.LoaderTSX}, err
					}
					if len(imports) > 0 {
						contents = strings.Join(imports, "\n") + "\n" + contents
					}

				}
				return api.OnLoadResult{Contents: &contents, Loader: api.LoaderTSX}, nil
			},
		)
	}}
}
