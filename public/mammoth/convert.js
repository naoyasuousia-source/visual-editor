// ブラウザ版では require("fs") や require("mammoth") は不要。
// HTML側で <script src="./mammoth.browser.min.js"></script> を読み込んでおけばOK。

async function convertDocx() {
    const fileInput = document.getElementById("fileInput");
    const outputDiv = document.getElementById("output");

    if (!fileInput.files[0]) {
        alert("ファイルを選択してね！");
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = async function (e) {
        const arrayBuffer = e.target.result;

        // Mammothのオプション設定
        const options = {
            // 1. 画像を完全に切り捨てる設定
            convertImage: mammoth.images.inline(() => ({})),

            // 2. 段落はデフォルトで <p> になる。
            // 必要に応じてここにスタイルマップを追加できる。
        };

        try {
            // 変換実行
            const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer }, options);

            // 結果を表示（result.value には <p> で括られたHTMLが入ってる）
            outputDiv.innerHTML = result.value;

            console.log("変換完了！");
            if (result.messages.length > 0) {
                console.log("Messages:", result.messages);
            }
        } catch (err) {
            console.error("変換エラー:", err);
            outputDiv.innerText = "エラーが発生したよ。";
        }
    };

    reader.readAsArrayBuffer(file);
}