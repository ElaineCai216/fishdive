import { store } from "../store.js";

export function openSettings(ctx) {
  const overlayRoot = document.getElementById("overlay-root");
  const state = store.getState();
  overlayRoot.innerHTML = `
    <div class="modal-mask settings">
      <div class="modal-card settings-card">
        <h3 class="modal-title">⚙️ 设置</h3>
        <div class="setting-row">
          <span class="setting-label">完成音效</span>
          <label class="switch">
            <input type="checkbox" id="setting-sound" ${state.settings.soundOn ? "checked" : ""}/>
            <span class="switch-track"></span>
          </label>
        </div>
        <div class="setting-row">
          <span class="setting-label">导出数据备份</span>
          <button type="button" class="btn-ghost sm" id="setting-export">导出 JSON</button>
        </div>
        <div class="setting-row">
          <span class="setting-label">导入数据</span>
          <button type="button" class="btn-ghost sm" id="setting-import">选择文件</button>
          <input type="file" id="setting-file" accept=".json,application/json" hidden/>
        </div>
        <p class="muted sm">数据只保存在本浏览器中，换设备不会同步；建议定期导出备份。</p>
        <button type="button" class="btn-primary full" id="setting-close">完成</button>
      </div>
    </div>`;

  const close = () => {
    overlayRoot.innerHTML = "";
  };
  overlayRoot.querySelector(".modal-mask").addEventListener("click", (e) => {
    if (e.target === e.currentTarget) close();
  });
  overlayRoot.querySelector("#setting-close").addEventListener("click", close);

  const sound = overlayRoot.querySelector("#setting-sound");
  sound.addEventListener("change", () => {
    store.update((s) => ({ ...s, settings: { ...s.settings, soundOn: sound.checked } }));
    ctx.toast(sound.checked ? "音效已开启 🔊" : "音效已关闭 🔇");
  });

  overlayRoot.querySelector("#setting-export").addEventListener("click", () => {
    const date = new Date();
    const stamp = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}`;
    const blob = new Blob([store.exportJSON()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fishdive-backup-${stamp}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    ctx.toast("已导出备份文件 📦");
  });

  const fileInput = overlayRoot.querySelector("#setting-file");
  overlayRoot.querySelector("#setting-import").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        store.importJSON(String(reader.result));
        ctx.toast("导入成功 🎉");
        close();
        ctx.refresh();
      } catch (e) {
        ctx.toast("导入失败：文件格式不正确");
      }
    };
    reader.readAsText(file);
    fileInput.value = "";
  });
}
