import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

interface ProcessResult {
  success: boolean;
  message: string;
  license?: string;
}

class TyporaCrackApp {
  private installPathInput: HTMLInputElement;
  private selectFolderBtn: HTMLButtonElement;
  private processBtn: HTMLButtonElement;
  private licenseCodeInput: HTMLInputElement;
  private copyLicenseBtn: HTMLButtonElement;
  private generateLicenseBtn: HTMLButtonElement;
  private statusMessage: HTMLElement;

  constructor() {
    this.installPathInput = document.querySelector("#install-path") as HTMLInputElement;
    this.selectFolderBtn = document.querySelector("#select-folder") as HTMLButtonElement;
    this.processBtn = document.querySelector("#process-btn") as HTMLButtonElement;
    this.licenseCodeInput = document.querySelector("#license-code") as HTMLInputElement;
    this.copyLicenseBtn = document.querySelector("#copy-license") as HTMLButtonElement;
    this.generateLicenseBtn = document.querySelector("#generate-license") as HTMLButtonElement;
    this.statusMessage = document.querySelector("#status-message") as HTMLElement;

    this.initEventListeners();
  }

  private initEventListeners() {
    this.selectFolderBtn.addEventListener("click", () => this.selectFolder());
    this.processBtn.addEventListener("click", () => this.processTypora());
    this.copyLicenseBtn.addEventListener("click", () => this.copyLicense());
    this.generateLicenseBtn.addEventListener("click", () => this.generateLicense());
  }

  private async selectFolder() {
    try {
      const selected = await open({
        directory: true,
        multiple: false,
        title: "选择Typora安装目录"
      });

      if (selected && typeof selected === "string") {
        this.installPathInput.value = selected;
        this.processBtn.disabled = false;
        this.showStatus("已选择安装目录，可以开始处理", "info");
      }
    } catch (error) {
      this.showStatus(`选择目录失败: ${error}`, "error");
    }
  }

  private async processTypora() {
    if (!this.installPathInput.value) {
      this.showStatus("请先选择Typora安装目录", "error");
      return;
    }

    this.processBtn.disabled = true;
    this.processBtn.textContent = "处理中...";
    this.showStatus("正在处理Typora文件，请稍候...", "info");

    try {
      const result: ProcessResult = await invoke("process_typora", {
        installPath: this.installPathInput.value
      });

      if (result.success) {
        this.showStatus(result.message, "success");
        if (result.license) {
          this.licenseCodeInput.value = result.license;
          this.copyLicenseBtn.disabled = false;
        }
      } else {
        this.showStatus(result.message, "error");
      }
    } catch (error) {
      this.showStatus(`处理失败: ${error}`, "error");
    } finally {
      this.processBtn.disabled = false;
      this.processBtn.textContent = "开始处理";
    }
  }

  private async generateLicense() {
    try {
      const license: string = await invoke("generate_license");
      this.licenseCodeInput.value = license;
      this.copyLicenseBtn.disabled = false;
      this.showStatus("已生成新的许可证码", "success");
    } catch (error) {
      this.showStatus(`生成许可证码失败: ${error}`, "error");
    }
  }

  private async copyLicense() {
    if (!this.licenseCodeInput.value) {
      this.showStatus("没有可复制的许可证码", "error");
      return;
    }

    try {
      await navigator.clipboard.writeText(this.licenseCodeInput.value);
      this.showStatus("许可证码已复制到剪贴板", "success");
      
      // 临时改变按钮文本
      const originalText = this.copyLicenseBtn.textContent;
      this.copyLicenseBtn.textContent = "已复制";
      setTimeout(() => {
        this.copyLicenseBtn.textContent = originalText;
      }, 2000);
    } catch (error) {
      // 如果现代API不可用，使用传统方法
      try {
        this.licenseCodeInput.select();
        document.execCommand('copy');
        this.showStatus("许可证码已复制到剪贴板", "success");
      } catch (fallbackError) {
        this.showStatus(`复制失败: ${error}`, "error");
      }
    }
  }

  private showStatus(message: string, type: "success" | "error" | "info") {
    this.statusMessage.textContent = message;
    this.statusMessage.className = `status-message ${type}`;
    
    // 自动清除成功和信息消息
    if (type === "success" || type === "info") {
      setTimeout(() => {
        this.statusMessage.textContent = "";
        this.statusMessage.className = "status-message";
      }, 5000);
    }
  }
}

// 初始化应用
window.addEventListener("DOMContentLoaded", () => {
  new TyporaCrackApp();
});

// 显示使用说明
window.addEventListener("load", () => {
  const statusEl = document.querySelector("#status-message") as HTMLElement;
  statusEl.textContent = "请选择Typora安装目录开始使用";
  statusEl.className = "status-message info";
});
