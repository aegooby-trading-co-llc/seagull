use std::{collections::HashMap, path::PathBuf, rc::Rc, sync::Arc, thread::available_parallelism};

use deno_core::{
    futures::future::LocalFutureObj, resolve_path, Extension, FsModuleLoader, OpDecl, Resource,
};
use deno_runtime::{
    deno_broadcast_channel::InMemoryBroadcastChannel,
    deno_web::BlobStore,
    ops::{
        io::Stdio,
        worker_host::{CreateWebWorkerCb, PreloadModuleCb},
    },
    permissions::Permissions,
    web_worker::{WebWorker, WebWorkerOptions},
    worker::{MainWorker, WorkerOptions},
    BootstrapOptions,
};

use crate::core::{error::err, result::Result};

fn cpu_count() -> usize {
    available_parallelism().map(|p| p.get()).unwrap_or(1)
}

fn create_web_worker_preload_module_callback() -> Arc<PreloadModuleCb> {
    Arc::new(move |worker| {
        let fut = async move { Ok(worker) };
        LocalFutureObj::new(Box::new(fut))
    })
}

fn create_web_worker_callback(
    stdio: deno_runtime::ops::io::Stdio,
    debug_flag: bool,
    cmd_args: Vec<String>,
) -> Arc<CreateWebWorkerCb> {
    Arc::new(move |args| {
        let create_web_worker_cb =
            create_web_worker_callback(stdio.clone(), debug_flag, cmd_args.clone());
        let preload_module_cb = create_web_worker_preload_module_callback();

        let options = WebWorkerOptions {
            bootstrap: BootstrapOptions {
                args: cmd_args.clone(),
                cpu_count: cpu_count(),
                debug_flag,
                enable_testing_features: false,
                location: Some(args.main_module.clone()),
                no_color: false,
                is_tty: false,
                runtime_version: "".into(),
                ts_version: "".into(),
                unstable: true,
                user_agent: "".into(),
            },
            extensions: vec![],
            unsafely_ignore_certificate_errors: None,
            root_cert_store: None,
            seed: None,
            module_loader: Rc::new(FsModuleLoader),
            create_web_worker_cb,
            preload_module_cb,
            format_js_error_fn: None,
            source_map_getter: None,
            worker_type: args.worker_type,
            maybe_inspector_server: None,
            get_error_class_fn: None,
            blob_store: BlobStore::default(),
            broadcast_channel: InMemoryBroadcastChannel::default(),
            shared_array_buffer_store: None,
            compiled_wasm_module_store: None,
            stdio: stdio.clone(),
        };

        WebWorker::bootstrap_from_options(
            args.name,
            args.permissions,
            args.main_module,
            args.worker_id,
            options,
        )
    })
}

pub struct JsWorker {
    worker: MainWorker,
}
impl JsWorker {
    pub fn new(
        main_path: &PathBuf,
        ops: Vec<OpDecl>,
        args: Vec<String>,
        debug_flag: bool,
    ) -> Result<Self> {
        let main_module = resolve_path(main_path.to_str().ok_or(err("Failed to join path"))?)?;
        let create_web_worker_cb =
            create_web_worker_callback(Stdio::default(), debug_flag, args.clone());
        let web_worker_preload_module_cb = create_web_worker_preload_module_callback();
        let worker = MainWorker::bootstrap_from_options(
            main_module.clone(),
            Permissions::allow_all(),
            WorkerOptions {
                bootstrap: BootstrapOptions {
                    args,
                    cpu_count: cpu_count(),
                    debug_flag,
                    enable_testing_features: false,
                    location: Some(main_module.clone()),
                    no_color: false,
                    is_tty: false,
                    runtime_version: "".into(),
                    ts_version: "".into(),
                    unstable: true,
                    user_agent: "".into(),
                },
                extensions: vec![Extension::builder().ops(ops).build()],
                unsafely_ignore_certificate_errors: None,
                root_cert_store: None,
                seed: None,
                module_loader: Rc::new(FsModuleLoader),
                create_web_worker_cb,
                web_worker_preload_module_cb,
                format_js_error_fn: None,
                source_map_getter: None,
                maybe_inspector_server: None,
                should_break_on_first_statement: false,
                get_error_class_fn: None,
                origin_storage_dir: None,
                blob_store: BlobStore::default(),
                broadcast_channel: InMemoryBroadcastChannel::default(),
                shared_array_buffer_store: None,
                compiled_wasm_module_store: None,
                stdio: Stdio::default(),
            },
        );
        Ok(Self { worker })
    }
    pub async fn run(&mut self, main_path: &PathBuf) -> Result<()> {
        let module = resolve_path(main_path.to_str().ok_or(err("Failed to join path"))?)?;
        self.worker.execute_main_module(&module).await?;
        Ok(())
    }
    pub fn resources(&mut self) -> HashMap<String, u32> {
        self.worker
            .js_runtime
            .op_state()
            .borrow_mut()
            .resource_table
            .names()
            .map(|(rid, name)| (name.to_string(), rid))
            .collect::<HashMap<String, u32>>()
    }
    pub fn get_resource<T: Resource>(&mut self, rid: u32) -> Result<Rc<T>> {
        self.worker
            .js_runtime
            .op_state()
            .borrow_mut()
            .resource_table
            .get::<T>(rid)
    }
}
