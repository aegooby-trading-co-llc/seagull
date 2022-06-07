package kv

import (
	"errors"
	"fmt"
	"io/fs"
	"lobster/esbuild/console"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"

	"github.com/cloudflare/cloudflare-go"
)

const pattern = "(.*)@([A-Z0-9]{8})(\\..*)"

func Upload(client *Client) error {
	regex, err := regexp.Compile(pattern)
	if err != nil {
		return err
	}
	keys, err := client.api.ListWorkersKVs(client.context, client.namespace)
	if err != nil {
		return err
	}
	var keymap sync.Map
	for _, key := range keys.Result {
		keymap.Store(key.Name, key.Metadata)
	}
	keymap.Range(func(key, value any) bool {
		return true
	})

	var uploads = make([]*cloudflare.WorkersKVPair, 0)

	err = filepath.WalkDir(BuildRoot, func(
		path string, dir fs.DirEntry, err error,
	) error {
		if err != nil {
			return err
		}
		if !dir.IsDir() {
			var route = strings.ReplaceAll(path, BuildRoot, "")
			var matches = regex.FindStringSubmatch(route)
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

			var mdInterface, okLoad = keymap.Load(key)
			if okLoad {
				keymap.Delete(key)
				var metadata, okConvert = mdInterface.(map[string]interface{})
				fmt.Println(metadata["Hash"])
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
					// err = addUpload()
					// if err != nil {
					// 	return err
					// }
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

	response, err := client.api.WriteWorkersKVBulk(client.context, client.namespace, uploads)
	if err != nil {
		return err
	}
	if !response.Success {
		return fmt.Errorf("%v", response.Errors)
	}

	return nil
}
