package cf

import (
	"context"
	"os"
	"sync"

	"github.com/cloudflare/cloudflare-go"
)

type Metadata struct {
	Hash string
}

type Client struct {
	api       *cloudflare.API
	context   context.Context
	namespace string
	keymap    sync.Map
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
