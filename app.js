(() => {
  'use strict';
  const THREE = window.THREE;
  const $ = id => document.getElementById(id);
  if (!THREE) { $('loadError').textContent = 'Three.js gagal dimuat. Periksa koneksi internet.'; return; }

  let scene, camera, renderer, clock, controls;
  const keys = {};
  const interactables = [];
  const raycaster = new THREE.Raycaster();
  const center = new THREE.Vector2(0, 0);
  let yaw = 0, pitch = 0, locked = false;
  const player = { height: 1.75, speed: 4.5, radius: .55 };
  const colliders = [];

  const colors = { stone:0xaaa39a, darkStone:0x39343a, gold:0xd8b477, wood:0x4d3021, glass:0x9eb8c6, blue:0x294b72, white:0xf0e3cf };
  const infoData = {
  'Komputer Jadul':
    'Komputer generasi awal dengan monitor kotak, CPU terpisah, dan keyboard klasik. Desainnya terinspirasi komputer desktop era 1980-an.',

  'Komputer Tabung CRT':
    'Komputer dengan monitor Cathode Ray Tube (CRT). Casing monitor yang dalam dan berat merupakan ciri khas komputer pada era 1990-an.',

  'Komputer Tebal':
    'Komputer desktop generasi lama dengan monitor bercasing tebal dan CPU berukuran besar. Model ini menunjukkan desain komputer yang mengutamakan ukuran dan ketahanan.',

  'Komputer All-in-One':
    'Komputer All-in-One menggabungkan monitor dan komponen utama komputer dalam satu perangkat. Desain ini menghemat ruang dan mengurangi kebutuhan kabel.',

  'Komputer Modern':
    'Komputer modern dengan monitor tipis, CPU berdesain kontemporer, keyboard, dan mouse. Perkembangan teknologi membuat komputer semakin ringkas dan bertenaga.'
};

// Membuat bagian komputer yang bisa diperiksa dengan tombol E atau klik.
function pcBox(w, h, d, mat, x, y, z, data, clickable = true) {
  const mesh = box(w, h, d, mat, x, y, z);

  if (clickable) {
    mesh.userData = data;
    interactables.push(mesh);
  }

  return mesh;
}

// Membuat meja pajangan komputer.
function addPcDesk(x, z, data) {
  const wood = material(0x493528, 0.65);

  // Permukaan meja.
  pcBox(3.1, 0.12, 1.8, wood, x, 0.92, z, data);

  // Empat kaki meja.
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      pcBox(
  0.12, 0.86, 0.12,
  material(0x38271e),
  x + sx * 0.88,
  0.43,
  z + sz * 0.48,
  data,
  false
);
    }
  }
}

// Membuat layar dengan pola visual di permukaannya.
function monitorScreen(
  data, x, y, frontZ, face, w, h, screenColor, glowColor
) {
  const screenMat = material(screenColor, 0.25);
  screenMat.emissive = new THREE.Color(glowColor);
  screenMat.emissiveIntensity = 0.45;

  pcBox(w, h, 0.035, screenMat, x, y, frontZ, data);

  const lineMat = material(glowColor, 0.35);

  // Garis antarmuka pada layar.
  for (let i = 0; i < 4; i++) {
    const lineWidth = w * (
      i === 0 ? 0.62 :
      i === 1 ? 0.42 :
      i === 2 ? 0.54 : 0.34
    );

    pcBox(
      lineWidth, 0.025, 0.012,
      lineMat,
      x,
      y + h * 0.22 - i * h * 0.14,
      frontZ + face * 0.025,
      data,
      false
    );
  }

  // Indikator kecil di sudut layar.
  pcBox(
    w * 0.10, h * 0.06, 0.012,
    material(glowColor, 0.3),
    x + w * 0.32,
    y - h * 0.32,
    frontZ + face * 0.025,
    data,
    false
  );
}

// Membuat keyboard dan mouse.
function addKeyboard(x, z, face, width, data, keyColor = 0x252932) {
  const keyboardZ = z + face * 0.56;

  pcBox(
    width, 0.075, 0.40,
    material(0x292d35),
    x, 1.02, keyboardZ, data
  );

  const keyMat = material(keyColor, 0.55);

  // Susunan tombol keyboard.
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 11; col++) {
      const keyX = x - width * 0.43 + col * width * 0.086;
      const keyZ = keyboardZ + face * ((row - 1) * 0.10);

      pcBox(
        width * 0.055, 0.022, 0.06,
        keyMat,
        keyX, 1.065, keyZ, data, false
      );
    }
  }

  // Mouse di sebelah kanan keyboard.
  pcBox(
    0.14, 0.07, 0.20,
    material(0x252932),
    x + width * 0.59,
    1.04,
    keyboardZ + face * 0.03,
    data
  );
}

// Membuat CPU desktop terpisah.
function addTower(
  x, z, face, data,
  color = 0xb7ae96,
  width = 0.58,
  height = 1.0,
  depth = 0.70
) {
  const centerY = 0.98 + height / 2;

  pcBox(
    width, height, depth,
    material(color, 0.55),
    x, centerY, z, data
  );

  const frontZ = z + face * (depth / 2 + 0.015);

  // Garis ventilasi pada bagian depan CPU.
  for (let i = 0; i < 4; i++) {
    pcBox(
      width * 0.55, 0.025, 0.018,
      material(0x353941),
      x,
      centerY + height * 0.08 - i * 0.11,
      frontZ,
      data,
      false
    );
  }

  // Lampu indikator CPU.
  pcBox(
    0.065, 0.065, 0.02,
    material(0x5ee6ab, 0.3),
    x + width * 0.28,
    centerY + height * 0.30,
    frontZ,
    data,
    false
  );
}

  function material(color, roughness=.65, metalness=0){ return new THREE.MeshStandardMaterial({color,roughness,metalness}); }
  function box(w,h,d,mat,x=0,y=0,z=0){ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);scene.add(m);return m; }
  function cyl(rt,rb,h,mat,x=0,y=0,z=0,segments=32){ const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,segments),mat);m.position.set(x,y,z);scene.add(m);return m; }
  function addCollider(x,z,w,d){colliders.push({x,z,w,d});}
  function wall(x,y,z,w,h,d,mat=material(colors.stone)){const m=box(w,h,d,mat,x,y,z);addCollider(x,z,w,d);return m;}
  function label(text,x,y,z,rotY=0){
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d');
    ctx.fillStyle='#f4e4c5';ctx.font='bold 32px Arial';ctx.textAlign='center';ctx.fillText(text,256,72);
    const tex=new THREE.CanvasTexture(canvas);const mesh = new THREE.Mesh(
  new THREE.PlaneGeometry(2.7, 0.67),
  new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    side: THREE.DoubleSide
  })
);mesh.position.set(x,y,z);mesh.rotation.y=rotY;scene.add(mesh);return mesh;
  }
  // Membuat salah satu dari lima model komputer.
function addExhibit(title, x, z, type) {
  const data = {
    title,
    text: infoData[title] || 'Informasi koleksi museum.'
  };

  // Komputer menghadap ke arah tengah ruangan.
  const face = z > 0 ? -1 : 1;

  // Alas pajangan.
  const base = cyl(
    1.35, 1.48, 0.22,
    material(colors.darkStone),
    x, 0.12, z
  );

  base.userData = data;
  interactables.push(base);

  // Meja komputer.
  addPcDesk(x, z, data);

  if (type === 'old') {
    // OBJEK 1: komputer jadul.
    const casing = material(0xc7bea6, 0.65);
    const depth = 0.72;

    // Monitor kecil bergaya retro.
    pcBox(1.35, 1.20, depth, casing, x, 2.05, z, data);

    monitorScreen(
      data, x, 2.08,
      z + face * (depth / 2 + 0.025),
      face, 0.98, 0.72,
      0x10231c, 0x48dc91
    );

    // Penyangga monitor dan dudukan.
    pcBox(0.25, 0.37, 0.25, casing, x, 1.25, z, data, false);
    pcBox(0.70, 0.08, 0.36, casing, x, 1.02, z, data);

    // CPU klasik berwarna krem.
    addTower(x + 1.22, z, face, data, 0xb7ae96, 0.56, 0.98, 0.68);

    addKeyboard(x, z, face, 0.95, data, 0xb9b19d);

  } else if (type === 'crt') {
    // OBJEK 2: monitor tabung CRT.
    const casing = material(0x92918c, 0.6);
    const depth = 1.12;

    // Monitor lebih dalam dan tebal.
    pcBox(1.70, 1.48, depth, casing, x, 2.05, z, data);

    monitorScreen(
      data, x, 2.08,
      z + face * (depth / 2 + 0.025),
      face, 1.30, 0.94,
      0x091b25, 0x54e0bd
    );

    // Panel tombol monitor CRT.
    for (let i = 0; i < 3; i++) {
      pcBox(
        0.065, 0.065, 0.025,
        material(0x34383a),
        x + 0.53 + i * 0.13,
        1.46,
        z + face * (depth / 2 + 0.025),
        data,
        false
      );
    }

    pcBox(0.26, 0.28, 0.30, casing, x, 1.19, z, data, false);
    pcBox(0.72, 0.08, 0.38, casing, x, 1.02, z, data);

    // CPU generasi lama.
    addTower(x + 1.22, z, face, data, 0x777b7b, 0.55, 0.95, 0.72);

    addKeyboard(x, z, face, 1.02, data, 0x8e918d);

  } else if (type === 'thick') {
    // OBJEK 3: komputer tebal dan besar.
    const casing = material(0xb8b5a9, 0.7);
    const depth = 1.05;

    pcBox(1.80, 1.55, depth, casing, x, 2.05, z, data);

    monitorScreen(
      data, x, 2.08,
      z + face * (depth / 2 + 0.025),
      face, 1.34, 0.96,
      0x25190d, 0xf2b865
    );

    // Penyangga dibuat lebih besar agar tampak kokoh.
    pcBox(0.34, 0.40, 0.38, casing, x, 1.22, z, data, false);
    pcBox(0.82, 0.10, 0.48, casing, x, 1.02, z, data);

    // Casing CPU berukuran besar.
    addTower(x + 1.22, z, face, data, 0x52565b, 0.60, 1.18, 0.78);

    addKeyboard(x, z, face, 1.12, data, 0x747772);

  } else if (type === 'aio') {
    // OBJEK 4: All-in-One, layar dan komputer menyatu.
    const casing = material(0xc9cbd0, 0.35);
    const depth = 0.18;

    // Satu bodi tipis berisi monitor dan komponen komputer.
    pcBox(1.78, 1.90, depth, casing, x, 2.05, z, data);

    monitorScreen(
      data, x, 2.06,
      z + face * (depth / 2 + 0.025),
      face, 1.56, 1.60,
      0x101c34, 0x68baff
    );

    // Penyangga layar.
    pcBox(0.18, 0.28, 0.18, casing, x, 1.08, z, data, false);
    pcBox(0.70, 0.08, 0.34, casing, x, 1.02, z, data);

    addKeyboard(x, z, face, 1.05, data, 0xb8bac0);

  } else if (type === 'modern') {
    // OBJEK 5: komputer modern.
    const casing = material(0x252a33, 0.35);
    const depth = 0.12;

    // Monitor tipis dengan bezel minimalis.
    pcBox(1.75, 1.17, depth, casing, x, 2.05, z, data);

    monitorScreen(
      data, x, 2.05,
      z + face * (depth / 2 + 0.025),
      face, 1.59, 0.99,
      0x071425, 0x40baff
    );

    // Dudukan monitor modern.
    pcBox(0.16, 0.38, 0.17, casing, x, 1.25, z, data, false);
    pcBox(0.72, 0.08, 0.35, casing, x, 1.02, z, data);

    // CPU modern dengan aksen lampu berwarna.
    addTower(x + 1.22, z, face, data, 0x202630, 0.56, 1.05, 0.72);

    // Aksen cahaya pada bagian depan CPU.
    pcBox(
      0.045, 0.66, 0.025,
      material(0x7b58ff, 0.25),
      x + 1.22,
      1.54,
      z + face * 0.385,
      data,
      false
    );

    addKeyboard(x, z, face, 1.05, data, 0x343a46);
  }

  // Label pajangan diarahkan ke area tengah museum.
  label(
    title.toUpperCase(),
    x,
    3.35,
    z + face * 1.45,
    face === 1 ? 0 : Math.PI
  );
}
  function createRoom(){
    const floor=material(0x77716a,.3,0);box(32,.2,32,floor,0,-.1,0);
    for(let x=-15;x<=15;x+=2)for(let z=-15;z<=15;z+=2){if((x+z)%4===0)box(1.96,.015,1.96,material(0xaaa39a,.25),x,.01,z);}
    const ceiling=material(0x3b3532,.8);box(32,.3,32,ceiling,0,8,0);
    wall(0,4,-16,32,8,.5);wall(0,4,16,32,8,.5);wall(-16,4,0,.5,8,32);wall(16,4,0,.5,8,32);
    for(let x=-12;x<=12;x+=6){for(const z of [-13.8,13.8]){cyl(.65,.78,7.2,material(colors.stone),x,3.6,z);cyl(.82,.82,.3,material(colors.gold),x,7.25,z);cyl(.82,.82,.3,material(colors.gold),x,.2,z);addCollider(x,z,1.5,1.5);}}
    for(let z=-12;z<=12;z+=6){for(const x of [-13.8,13.8]){cyl(.65,.78,7.2,material(colors.stone),x,3.6,z);cyl(.82,.82,.3,material(colors.gold),x,7.25,z);cyl(.82,.82,.3,material(colors.gold),x,.2,z);addCollider(x,z,1.5,1.5);}}
    cyl(5.8,5.8,.35,material(colors.darkStone),0,.2,0);cyl(5.3,5.3,.12,material(colors.gold),0,.4,0);
    cyl(4.7,4.7,.12,material(0x2b303b,.3),0,.48,0);
    cyl(4.4,4.4,.12,material(0x8e8477,.25),0,.55,0);
    cyl(4.5,4.5,.2,material(colors.gold,.35),0,7.55,0);cyl(4.1,4.1,.12,material(0xf2e3c3,.2),0,7.7,0);
    for(let i=0;i<12;i++){const a=i*Math.PI/6;const x=Math.cos(a)*5.1,z=Math.sin(a)*5.1;cyl(.18,.18,7.1,material(colors.gold,.4),x,3.6,z);addCollider(x,z,.5,.5);}
    addExhibit('Komputer Jadul', 0, -2, 'old');
addExhibit('Komputer Tabung CRT', -8, -7, 'crt');
addExhibit('Komputer Tebal', 8, -7, 'thick');
addExhibit('Komputer All-in-One', -8, 7, 'aio');
addExhibit('Komputer Modern', 8, 7, 'modern');
    label('ARCADIA',0,7.9,-15.7,0);
    for(let x=-12;x<=12;x+=4){const light=cyl(.22,.22,.05,material(0xffe7b0,.2),x,7.8,0);light.material.emissive=new THREE.Color(0xffb85c);}
  }
  function setup(){
    scene=new THREE.Scene();scene.background=new THREE.Color(0x080b12);scene.fog=new THREE.Fog(0x080b12,10,35);
    camera=new THREE.PerspectiveCamera(75,innerWidth/innerHeight,.1,100);camera.position.set(0,player.height,11);camera.rotation.order='YXZ';
    renderer=new THREE.WebGLRenderer({antialias:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputEncoding=THREE.sRGBEncoding;document.body.appendChild(renderer.domElement);
    clock=new THREE.Clock();
    scene.add(new THREE.HemisphereLight(0xf4dfbd,0x202637,1.6));const key=new THREE.DirectionalLight(0xffd9a0,2.4);key.position.set(5,12,4);key.castShadow=true;key.shadow.mapSize.set(2048,2048);scene.add(key);
    const fill=new THREE.PointLight(0x6f91ff,3,18);fill.position.set(-8,4,-5);scene.add(fill);
    createRoom();
    renderer.domElement.addEventListener('click',()=>{if(!locked)renderer.domElement.requestPointerLock();});
    document.addEventListener('pointerlockchange',()=>{locked=document.pointerLockElement===renderer.domElement;$('prompt').style.opacity=locked?'0':'1';});
    document.addEventListener('mousemove',e=>{if(!locked)return;yaw-=e.movementX*.0022;pitch-=e.movementY*.0022;pitch=Math.max(-Math.PI/2.05,Math.min(Math.PI/2.05,pitch));camera.rotation.set(pitch,yaw,0);});
    document.addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='KeyE')inspect();if(e.code==='Escape')closeInfo();});document.addEventListener('keyup',e=>keys[e.code]=false);
    renderer.domElement.addEventListener('click',()=>{if(locked)inspect();});$('close').addEventListener('click',closeInfo);addResize();
    $('loading').style.opacity='0';setTimeout(()=>$('loading').remove(),750);animate();
  }
  function addResize(){addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});}
  function blocked(x,z){return colliders.some(c=>Math.abs(x-c.x)<c.w/2+player.radius&&Math.abs(z-c.z)<c.d/2+player.radius);}
  function move(dt){const dir=new THREE.Vector3();if(keys.KeyW)dir.z-=1;if(keys.KeyS)dir.z+=1;if(keys.KeyA)dir.x-=1;if(keys.KeyD)dir.x+=1;if(!dir.lengthSq())return;dir.normalize();const forward=new THREE.Vector3(-Math.sin(yaw),0,-Math.cos(yaw));const right=new THREE.Vector3(Math.cos(yaw),0,-Math.sin(yaw));const delta=forward.multiplyScalar(dir.z).add(right.multiplyScalar(dir.x)).multiplyScalar(player.speed*dt);const nx=camera.position.x+delta.x,nz=camera.position.z+delta.z;if(!blocked(nx,camera.position.z))camera.position.x=THREE.MathUtils.clamp(nx,-14.5,14.5);if(!blocked(camera.position.x,nz))camera.position.z=THREE.MathUtils.clamp(nz,-14.5,14.5);$('location').textContent=Math.hypot(camera.position.x,camera.position.z)<6?'CENTRAL ROTUNDA':camera.position.z<0?'NORTH GALLERY':'SOUTH GALLERY';}
  function inspect(){raycaster.setFromCamera(center,camera);const hits=raycaster.intersectObjects(interactables,false);if(hits.length&&hits[0].distance<6){const d=hits[0].object.userData;$('infoTitle').textContent=d.title;$('infoText').textContent=d.text;$('info').classList.remove('hidden');}}
  function closeInfo(){$('info').classList.add('hidden');}
  function animate(){requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05);move(dt);renderer.render(scene,camera);}
  try{setup();}catch(err){console.error(err);$('loadError').textContent='Terjadi error: '+err.message;$('loading').querySelector('p').textContent='Gagal memuat museum';}
})();
