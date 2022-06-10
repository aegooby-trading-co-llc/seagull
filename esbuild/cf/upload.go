package cf

import (
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"regexp"
	"strings"

	"github.com/cloudflare/cloudflare-go"

	"lobster/esbuild/config"
	"lobster/esbuild/console"
)

const hashedFilePattern = "(.*)@([A-Z0-9]{8})(\\..*)"

type CfUploadOptions struct {
	Exclude []string
}

func Upload(client *Client, options CfUploadOptions) error {
	hashedFileRegex, err := regexp.Compile(hashedFilePattern)
	if err != nil {
		return err
	}
	keys, err := client.api.ListWorkersKVs(client.context, client.namespace)
	if err != nil {
		return err
	}
	for _, key := range keys.Result {
		client.keymap.Store(key.Name, key.Metadata)
	}

	var uploads = make([]*cloudflare.WorkersKVPair, 0)

	err = filepath.WalkDir(config.BuildRoot, func(
		path string, dir fs.DirEntry, err error,
	) error {
		if err != nil {
			return err
		}
		var excludeRegexes = make([]*regexp.Regexp, 0)
		for _, excludePattern := range options.Exclude {
			regex, err := regexp.Compile(excludePattern)
			if err != nil {
				return err
			}
			excludeRegexes = append(excludeRegexes, regex)
		}
		if !dir.IsDir() {
			var route = strings.ReplaceAll(path, config.BuildRoot, "")
			for _, excludeRegex := range excludeRegexes {
				if excludeRegex.MatchString(route) {
					return nil
				}
			}
			fmt.Println(route)
			var matches = hashedFileRegex.FindStringSubmatch(route)
			if len(matches) != 4 {
				return errors.New(
					"failed to match filename, check hash pattern",
				)
			}
			var key = matches[1] + matches[3]
			var hash = matches[2]

			var addUpload = func() error {
				file, err := os.ReadFile(path)
				if err != nil {
					return err
				}
				var value = string(file)
				uploads = append(
					uploads,
					&cloudflare.WorkersKVPair{
						Key:      key,
						Value:    value,
						Metadata: Metadata{Hash: hash},
					},
				)
				return nil
			}

			var mdInterface, okLoad = client.keymap.Load(key)
			if okLoad {
				client.keymap.Delete(key)
				var metadata, okConvert = mdInterface.(map[string]interface{})
				if okConvert {
					// File has been updated
					if hash != metadata["Hash"] {
						err = addUpload()
						if err != nil {
							return err
						}
					}
				} else {
					console.Warn("No metadata found for key", key)
					err = addUpload()
					if err != nil {
						return err
					}
				}
			} else {
				err = addUpload()
				if err != nil {
					return err
				}
			}
		}

		return nil
	})

	if err != nil {
		return err
	}

	if len(uploads) > 0 {
		console.Log("New build files:")
		for _, upload := range uploads {
			console.Print(upload.Key)
		}
	}
	response, err := client.api.WriteWorkersKVBulk(client.context, client.namespace, uploads)
	if err != nil {
		return err
	}
	if !response.Success {
		return fmt.Errorf("%v", response.Errors)
	}

	return nil
}
