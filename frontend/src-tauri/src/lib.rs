use std::sync::Mutex;

use tauri::Manager;

use tauri_plugin_shell::{
    process::{
        CommandChild,
        CommandEvent,
    },
    ShellExt,
};


struct BackendProcess(
    Mutex<
        Option<CommandChild>
    >,
);


#[cfg_attr(
    mobile,
    tauri::mobile_entry_point
)]
pub fn run() {

    let app =
        tauri::Builder::default()

            /*
             * Tiene que registrarse
             * antes que los demás.
             */
            .plugin(
                tauri_plugin_single_instance::init(
                    |app, _args, _cwd| {

                        if let Some(
                            window
                        ) =
                            app.get_webview_window(
                                "main"
                            )
                        {

                            let _ =
                                window.show();

                            let _ =
                                window.set_focus();
                        }
                    }
                )
            )

            .plugin(
                tauri_plugin_shell::init()
            )

            .plugin(
                tauri_plugin_opener::init()
            )

            .plugin(
                tauri_plugin_updater::Builder::new()
                    .build()
            )

            .setup(
                |app| {

                    /*
                     * Le pasamos al backend
                     * el PID de Tauri.
                     *
                     * De esta manera el
                     * backend sabe cuándo
                     * tiene que cerrarse.
                     */

                    let parent_pid =
                        std::process::id()
                            .to_string();


                    let sidecar =
                        app
                            .shell()
                            .sidecar(
                                "mr11-backend"
                            )?
                            .args([
                                "--parent-pid",
                                parent_pid
                                    .as_str(),
                            ]);


                    let (
                        mut rx,
                        child,
                    ) =
                        sidecar
                            .spawn()?;


                    /*
                     * Guardamos el proceso
                     * para poder cerrarlo
                     * correctamente.
                     */

                    app.manage(
                        BackendProcess(
                            Mutex::new(
                                Some(
                                    child
                                )
                            )
                        )
                    );


                    /*
                     * Consumimos stdout /
                     * stderr para evitar
                     * bloquear el proceso.
                     */

                    tauri::async_runtime::spawn(
                        async move {

                            while let Some(
                                evento
                            ) =
                                rx.recv()
                                    .await
                            {

                                match evento {

                                    CommandEvent::Stdout(
                                        bytes
                                    ) => {

                                        println!(
                                            "BACKEND: {}",
                                            String::from_utf8_lossy(
                                                &bytes
                                            )
                                        );
                                    }

                                    CommandEvent::Stderr(
                                        bytes
                                    ) => {

                                        eprintln!(
                                            "BACKEND ERROR: {}",
                                            String::from_utf8_lossy(
                                                &bytes
                                            )
                                        );
                                    }

                                    CommandEvent::Terminated(
                                        payload
                                    ) => {

                                        println!(
                                            "Backend finalizado: {:?}",
                                            payload
                                        );
                                    }

                                    _ => {}
                                }
                            }
                        }
                    );


                    Ok(())
                }
            )

            .build(
                tauri::generate_context!()
            )

            .expect(
                "error al construir MR11"
            );


    app.run(
        |
            app_handle,
            event
        | {

            if let tauri::RunEvent::Exit =
                event
            {

                let estado =
                    app_handle
                        .state::<BackendProcess>();


                if let Ok(
                    mut proceso
                ) =
                    estado
                        .0
                        .lock()
                {

                    if let Some(
                        child
                    ) =
                        proceso.take()
                    {

                        let _ =
                            child.kill();
                    }
                }
            }
        }
    );
}