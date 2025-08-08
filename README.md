
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>City Pop 音乐互动游戏</title>
  <script src="https://cdn.jsdelivr.net/npm/tone@14.7.77/build/Tone.min.js"></script>
  <style>
    html, body {
      margin: 0;
      padding: 0;
      overflow: hidden;
      height: 100%;
      background: radial-gradient(circle at center, #1e3c72, #2a5298);
      color: white;
      font-family: sans-serif;
    }
    canvas {
      display: block;
      position: absolute;
      top: 0;
      left: 0;
    }
    #msg {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 2em;
      opacity: 0.7;
      text-align: center;
    }
  </style>
</head>
<body>
<canvas id="canvas"></canvas>
<div id="msg">点击或按任意键开始演奏 🎵</div>

<script>
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const drum = new Tone.MembraneSynth().toDestination();
  const synth = new Tone.Synth().toDestination();

  const particles = [];

  function createParticle(x, y, color) {
    particles.push({ x, y, r: 10, life: 100, color });
  }

  function animate() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, 2 * Math.PI);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / 100;
      ctx.fill();
      p.r += 1.5;
      p.life -= 2;
      if (p.life <= 0) particles.splice(i, 1);
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(animate);
  }
  animate();

  function playEffect(x, y, isDrum) {
    const color = isDrum ? "#66ffff" : "#aa88ff";
    createParticle(x, y, color);
    if (Tone.context.state !== "running") Tone.start();
    if (isDrum) {
      drum.triggerAttackRelease("C2", "8n");
    } else {
      synth.triggerAttackRelease("C4", "4n");
    }
  }

  document.addEventListener("pointerdown", (e) => {
    document.getElementById("msg").style.display = "none";
    playEffect(e.clientX, e.clientY, Math.random() > 0.5);
  });

  document.addEventListener("keydown", (e) => {
    document.getElementById("msg").style.display = "none";
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    playEffect(x, y, e.key === " ");
  });
</script>
</body>
</html>
