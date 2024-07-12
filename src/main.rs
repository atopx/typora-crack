use std::convert::AsRef;
use std::env::args;
use std::fs::File;
use std::fs::OpenOptions;
use std::fs::{self};
use std::io::Write;
use std::ops::Not;
use std::path::PathBuf;

mod asar;
mod gencode;

const HOOK_BYTES: &[u8] = include_bytes!("hook.js");
// /usr/share/typora/
fn main() {
    let root = match args().nth(1) {
        Some(root) => PathBuf::from(root),
        None => panic!("missing typora install path args. usage: ./typora-crack [Path]"),
    };

    let src = root.join("resources/node_modules.asar");
    let dst = root.join("node");

    if src.exists().not() {
        panic!("invalid typora install path.")
    }

    if dst.exists() {
        fs::remove_dir_all(&dst).unwrap();
    }

    // unpack resource
    let src_str = src.to_str().unwrap();
    let dst_str = dst.to_str().unwrap();
    asar::unpack(src_str, dst_str).unwrap();

    // reject hook.js
    let hook_path = root.join("node/raven/hook.js");
    File::create(hook_path).unwrap().write_all(HOOK_BYTES).unwrap();

    // reject index.js
    let index_path = root.join("node/raven/index.js");
    OpenOptions::new()
        .append(true)
        .open(index_path)
        .unwrap()
        .write_all("\nrequire('./hook')".as_ref())
        .unwrap();

    // pack resource
    asar::pack(dst_str, src_str).unwrap();

    // clean
    fs::remove_dir_all(&dst).unwrap();

    // generate listen code
    println!("Email address can be filled in freely, license code: {}", gencode::license());
}
