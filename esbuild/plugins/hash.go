package plugins

import (
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/evanw/esbuild/pkg/api"
	"github.com/pelletier/go-toml/v2"

	"lobster/esbuild/cf"
	"lobster/esbuild/console"
)

const jsPathPattern = "(.*)(\\.js$)"
const hashPattern = "@[A-Z0-9]{8}"

type HashConfig struct {
	WorkerPath string
}

func Hash(pluginConfig HashConfig) api.Plugin {
	return api.Plugin{Name: "hash", Setup: func(build api.PluginBuild) {
		build.OnEnd(
			func(result *api.BuildResult) {
				console.Log("Updating Wrangler config")
				cwd, err := os.Getwd()
				if err != nil {
					console.Error("Could not obtain working directory")
					return
				}
				var residual string
				rel, err := filepath.Rel(cwd, build.InitialOptions.Outdir)
				if err != nil {
					residual = filepath.Join(cwd, build.InitialOptions.Outdir)
				} else {
					if rel == "." {
						residual = build.InitialOptions.Outdir
					} else {
						console.Error(
							"Could not comprehend outdir:",
							build.InitialOptions.Outdir,
						)
						return
					}
				}
				regex, err := regexp.Compile(jsPathPattern)
				if err != nil {
					console.Error("Failed to compile regex")
					return
				}
				var matches = regex.FindStringSubmatch(pluginConfig.WorkerPath)
				if len(matches) != 3 {
					console.Error(
						"pluginConfig.WorkerPath must be in the format /**/*.js",
					)
					return
				}
				for _, outfile := range result.OutputFiles {
					var path = strings.ReplaceAll(outfile.Path, residual, "")
					matched, err := regexp.MatchString(
						matches[1]+hashPattern+matches[2]+"$", path,
					)
					if err != nil {
						console.Error(
							"Failed to match worker file among generated files",
						)
						return
					}
					if matched {
						wranglerToml, err := os.ReadFile("wrangler.toml")
						if err != nil {
							console.Error("Could not read wrangler.toml")
							return
						}
						var wranglerConfig cf.WranglerConfig
						err = toml.Unmarshal(wranglerToml, &wranglerConfig)
						if err != nil {
							console.Error("Failed to unmarshal TOML")
							return
						}
						wranglerConfig.Main = filepath.Join(
							build.InitialOptions.Outdir, path,
						)
						wranglerToml, err = toml.Marshal(&wranglerConfig)
						if err != nil {
							console.Error("Failed to marshal TOML")
						}
						os.WriteFile("wrangler.toml", wranglerToml, 0644)
					}
				}
			},
		)
	},
	}
}
