package plugins

import (
	"github.com/evanw/esbuild/pkg/api"
)

func CSS(pluginConfig RelayConfig) api.Plugin {
	return api.Plugin{Name: "css", Setup: func(build api.PluginBuild) {
		build.OnLoad(api.OnLoadOptions{Filter: "\\.module\\.css$"},
			func(ola api.OnLoadArgs) (api.OnLoadResult, error) {
				return api.OnLoadResult{}, nil
			},
		)
	}}
}
