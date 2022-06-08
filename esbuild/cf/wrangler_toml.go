package cf

type WranglerTriggers struct {
	Crons []string "toml:\"crons\""
}
type WranglerKVNamespace struct {
	Binding   string "toml:\"binding\""
	Id        string "toml:\"id\""
	PreviewId string "toml:\"preview_id\""
}
type WranglerDurableObject struct {
	Name       string "toml:\"name\""
	ClassName  string "toml:\"class_name\""
	ScriptName string "toml:\"script_name\""
}
type WranglerDurableObjects struct {
	Bindings []WranglerDurableObject "toml:\"bindings\""
}
type WranglerRenamedClasses struct {
	From string "toml:\"from\""
	To   string "toml:\"to\""
}
type WranglerMigration struct {
	Tag            string                   "toml:\"tag\""
	NewClasses     []string                 "toml:\"new_classes\""
	RenamedClasses []WranglerRenamedClasses "toml:\"renamed_classes\""
	DeletedClasses []string                 "toml:\"deleted_classes\""
}
type WranglerR2Buckets struct {
	Binding           string "toml:\"binding\""
	BucketName        string "toml:\"bucket_name\""
	PreviewBucketName string "toml:\"preview_bucket_name\""
}
type WranglerBuild struct {
	Command string "toml:\"command\""
}
type WranglerConfig struct {
	Name               string                 "toml:\"name\""
	Main               string                 "toml:\"main\""
	AccountId          string                 "toml:\"account_id\""
	WorkersDev         bool                   "toml:\"workers_dev\""
	UsageModel         string                 "toml:\"usage_model\""
	Routes             []string               "toml:\"routes\""
	Route              string                 "toml:\"route\""
	Triggers           WranglerTriggers       "toml:\"triggers\""
	Vars               interface{}            "toml:\"vars\""
	KvNamespaces       []WranglerKVNamespace  "toml:\"kv_namespaces\""
	DurableObjects     WranglerDurableObjects "toml:\"durable_objects\""
	R2Buckets          WranglerR2Buckets      "toml:\"r2_buckets\""
	CompatibilityDate  string                 "toml:\"compatibility_date\""
	CompatibilityFlags []string               "toml:\"compatibility_flags\""
	Build              WranglerBuild          "toml:\"build\""
}
