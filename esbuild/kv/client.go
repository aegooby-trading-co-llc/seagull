package kv

import (
	"context"
	"os"

	"github.com/cloudflare/cloudflare-go"
)

const BuildRoot = "build/esbuild"

type Metadata struct {
	Hash string
}

type Client struct {
	api       *cloudflare.API
	context   context.Context
	namespace string
}

func Create() (Client, error) {
	var context = context.Background()
	var apiToken = os.Getenv("CLOUDFLARE_CRINGE_API_TOKEN")
	var accountId = os.Getenv("CLOUDFLARE_ACCOUNT_ID")
	var namespaceId = os.Getenv("CLOUDFLARE_NAMESPACE_ID_PREVIEW")
	api, err := cloudflare.NewWithAPIToken(apiToken)
	if err != nil {
		return Client{}, err
	}
	api.AccountID = accountId

	return Client{api: api, context: context, namespace: namespaceId}, nil
}
