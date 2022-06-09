package plugins

import (
	"encoding/base32"
	"encoding/json"
	"errors"
	"io/ioutil"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/cespare/xxhash/v2"
	"github.com/evanw/esbuild/pkg/api"
	"github.com/iancoleman/strcase"
	"github.com/yisar/peacecss"
)

const cssPathPattern = "(.*)(\\.module\\.css$)"

type CSSConfig struct{}

func CSS(pluginConfig CSSConfig) api.Plugin {
	return api.Plugin{Name: "css", Setup: func(build api.PluginBuild) {
		cwd, err := os.Getwd()
		var parser = peacecss.NewParser()

		build.OnLoad(api.OnLoadOptions{Filter: "\\.module\\.css$"},
			func(ola api.OnLoadArgs) (api.OnLoadResult, error) {
				if err != nil {
					return api.OnLoadResult{}, err
				}
				// relativeDir, err := filepath.Rel(cwd, filepath.Dir(ola.Path))
				// if err != nil {
				// 	return api.OnLoadResult{}, err
				// }
				file, err := ioutil.ReadFile(ola.Path)
				if err != nil {
					return api.OnLoadResult{}, err
				}
				// var contents = string(file)

				var ast = parser.Parse(file)
				var classMap = make(map[string]string)
				ast.Traverse(func(node *peacecss.CSSDefinition) {
					if node.Selector == nil || node.Selector.IsControlSelector() {
						return
					}

					var className = node.Selector.Selector

					var hasher = xxhash.New()
					hasher.Write([]byte(ola.Path + className))
					var hash = base32.StdEncoding.EncodeToString(hasher.Sum(nil))[:8]

					var scopedName = className + "--" + hash[:8]
					classMap[strcase.ToLowerCamel(className)] = scopedName
					node.Selector.Selector = scopedName
				})
				var buffer = ast.Minisize()
				var cssBytes = buffer.Bytes()

				var hasher = xxhash.New()
				hasher.Write(cssBytes)
				var hash = base32.StdEncoding.EncodeToString(hasher.Sum(nil))[:8]

				var path = strings.ReplaceAll(ola.Path, cwd, "")
				regex, err := regexp.Compile(cssPathPattern)
				if err != nil {
					return api.OnLoadResult{}, err
				}
				var matches = regex.FindStringSubmatch(path)
				if len(matches) != 3 {
					return api.OnLoadResult{}, errors.New(
						"Could not parse CSS module path " + path,
					)
				}
				var newPath = matches[1] + "@" + hash + matches[2]
				var fullPath = filepath.Join(
					cwd, build.InitialOptions.Outdir, newPath,
				)

				err = os.WriteFile(fullPath, cssBytes, 0644)
				if err != nil {
					return api.OnLoadResult{}, err
				}

				export, err := json.MarshalIndent(classMap, "", "    ")
				if err != nil {
					return api.OnLoadResult{}, err
				}
				var contents = //"import \"./" + filepath.Base(newPath) + "\";\n" +
				"export default " + string(export) + ";\n"

				return api.OnLoadResult{Contents: &contents, Loader: api.LoaderTS}, nil
			},
		)
	}}
}
