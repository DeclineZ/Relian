export default function openDiagramInNewTab(svg) {
  if (!svg) return;

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Mermaid Diagram</title>
  <style>
    :root { --bg:#fff; --btn:#1e40af; }
    html,body{margin:0;height:100%;overflow:hidden;background:var(--bg);}
    #toolbar{position:fixed;top:12px;right:12px;display:flex;gap:8px;z-index:10}
    button{background:var(--btn);color:#fff;border:0;border-radius:4px;
           padding:6px 10px;font:14px/1.2 system-ui,sans-serif;cursor:pointer;}
    button:active{transform:scale(.97);}
    #canvas{width:100%;height:100%;display:flex;align-items:center;
            justify-content:center;cursor:grab;transition:transform .15s;
            transform-origin:center center;}
    #canvas.grabbing{cursor:grabbing;}
    svg{max-width:none;max-height:none;}
  </style>
</head>
<body>
  <div id="toolbar">
    <button id="zoomIn">＋</button>
    <button id="zoomOut">－</button>
    <button id="reset">⟳</button>
  </div>
  <div id="canvas">${svg.outerHTML}</div>

  <script>
    (function(){
      const canvas = document.getElementById('canvas');

      /* ── zoom / pan state ── */
      let scale = 1, tx = 0, ty = 0;

      function apply() {
        canvas.style.transform =
          'translate(' + tx + 'px,' + ty + 'px) scale(' + scale + ')';
      }

      function setScale(s) {
        const newScale = Math.min(5, Math.max(0.2, s));
        const factor = newScale / scale;
        scale = newScale;
        tx *= factor; ty *= factor;
        apply();
      }

      document.getElementById('zoomIn').onclick  = () => setScale(scale * 1.2);
      document.getElementById('zoomOut').onclick = () => setScale(scale / 1.2);
      document.getElementById('reset').onclick   = () => { scale = 1; tx = ty = 0; apply(); };

      /* wheel zoom */
      window.addEventListener('wheel', e => {
        e.preventDefault();
        setScale(scale * (e.deltaY < 0 ? 1.1 : 0.9));
      }, { passive:false });

      /* drag-to-pan */
      let startX, startY, startTx, startTy, dragging = false;
      canvas.addEventListener('mousedown', e => {
        dragging = true;
        canvas.classList.add('grabbing');
        startX = e.clientX; startY = e.clientY;
        startTx = tx; startTy = ty;
      });
      window.addEventListener('mousemove', e => {
        if (!dragging) return;
        tx = startTx + (e.clientX - startX);
        ty = startTy + (e.clientY - startY);
        apply();
      });
      window.addEventListener('mouseup', () => {
        dragging = false;
        canvas.classList.remove('grabbing');
      });
    })();
  </script>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url  = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);   // tidy up
}