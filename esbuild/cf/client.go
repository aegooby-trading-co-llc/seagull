package cf

import (
	"context"
	"errors"
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

type CreateOptions struct {
	Destination string
}

func Create(options CreateOptions) (Client, error) {
	var context = context.Background()
	var apiToken = os.Getenv("CLOUDFLARE_API_TOKEN")
	var accountId = os.Getenv("CLOUDFLARE_ACCOUNT_ID")
	var namespaceId string
	switch options.Destination {
	case "preview":
		namespaceId = os.Getenv("CLOUDFLARE_NAMESPACE_ID_PREVIEW")
	case "live":
		namespaceId = os.Getenv("CLOUDFLARE_NAMESPACE_ID")
	default:
		return Client{}, errors.New("invalid destination " + options.Destination)
	}
	api, err := cloudflare.NewWithAPIToken(apiToken)
	if err != nil {
		return Client{}, err
	}
	api.AccountID = accountId

	return Client{api: api, context: context, namespace: namespaceId}, nil
}
