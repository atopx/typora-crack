mod asar;
mod gencode;

use std::fs;
use std::fs::File;
use std::fs::OpenOptions;
use std::io::Write;
use std::path::PathBuf;

const HOOK_BYTES: &[u8] = include_bytes!("hook.js");

#[derive(serde::Serialize)]
struct ProcessResult {
    success: bool,
    message: String,
    license: Option<String>,
}

// 生成许可证码
#[tauri::command]
fn generate_license() -> String {
    gencode::license()
}

// 处理Typora安装目录
#[tauri::command]
async fn process_typora(install_path: String) -> Result<ProcessResult, String> {
    let root = PathBuf::from(&install_path);
    let src = root.join("resources/node_modules.asar");
    let dst = root.join("node");

    if !src.exists() {
        return Ok(ProcessResult {
            success: false,
            message: "无效的Typora安装路径，找不到node_modules.asar文件".to_string(),
            license: None,
        });
    }

    // 如果目标目录存在，先删除
    if dst.exists() {
        if let Err(e) = fs::remove_dir_all(&dst) {
            return Ok(ProcessResult {
                success: false,
                message: format!("删除临时目录失败: {}", e),
                license: None,
            });
        }
    }

    // 解包asar文件
    let src_str = src.to_str().unwrap();
    let dst_str = dst.to_str().unwrap();
    if let Err(e) = asar::unpack(src_str, dst_str) {
        return Ok(ProcessResult {
            success: false,
            message: format!("解包asar文件失败: {}", e),
            license: None,
        });
    }

    // 注入hook.js
    let hook_path = root.join("node/raven/hook.js");
    if let Err(e) = File::create(&hook_path).and_then(|mut f| f.write_all(HOOK_BYTES)) {
        return Ok(ProcessResult {
            success: false,
            message: format!("创建hook.js文件失败: {}", e),
            license: None,
        });
    }

    // 修改index.js
    let index_path = root.join("node/raven/index.js");
    if let Err(e) = OpenOptions::new()
        .append(true)
        .open(&index_path)
        .and_then(|mut f| f.write_all("\nrequire('./hook')".as_bytes()))
    {
        return Ok(ProcessResult {
            success: false,
            message: format!("修改index.js文件失败: {}", e),
            license: None,
        });
    }

    // 重新打包asar文件
    if let Err(e) = asar::pack(dst_str, src_str) {
        return Ok(ProcessResult {
            success: false,
            message: format!("打包asar文件失败: {}", e),
            license: None,
        });
    }

    // 清理临时目录
    if let Err(e) = fs::remove_dir_all(&dst) {
        return Ok(ProcessResult {
            success: false,
            message: format!("清理临时目录失败: {}", e),
            license: None,
        });
    }

    // 生成许可证码
    let license = gencode::license();

    Ok(ProcessResult {
        success: true,
        message: "Typora破解成功！".to_string(),
        license: Some(license),
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![generate_license, process_typora])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
