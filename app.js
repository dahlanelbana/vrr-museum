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
    'Patung Peradaban':'Patung simbolik yang menggambarkan perjalanan manusia dari masa awal hingga era modern.',
    'Artefak Kuno':'Replika artefak kuno yang ditempatkan dalam vitrin kaca dengan pencahayaan terarah.',
    'Galeri Astronomi':'Panel edukasi mengenai bintang, planet, dan hubungan manusia dengan langit malam.',
    'Relief Sejarah':'Relief dekoratif yang menceritakan perkembangan kebudayaan dan pengetahuan.'
  };

  function material(color, roughness=.65, metalness=0){ return new THREE.MeshStandardMaterial({color,roughness,metalness}); }
  function box(w,h,d,mat,x=0,y=0,z=0){ const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);scene.add(m);return m; }
  function cyl(rt,rb,h,mat,x=0,y=0,z=0,segments=32){ const m=new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,segments),mat);m.position.set(x,y,z);scene.add(m);return m; }
  function addCollider(x,z,w,d){colliders.push({x,z,w,d});}
  function wall(x,y,z,w,h,d,mat=material(colors.stone)){const m=box(w,h,d,mat,x,y,z);addCollider(x,z,w,d);return m;}
  function label(text,x,y,z,rotY=0){
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d');
    ctx.fillStyle='#f4e4c5';ctx.font='bold 32px Arial';ctx.textAlign='center';ctx.fillText(text,256,72);
    const tex=new THREE.CanvasTexture(canvas);const mesh=new THREE.Mesh(new THREE.PlaneGeometry(2.7,.67),new THREE.MeshBasicMaterial({map:tex,transparent:true}));mesh.position.set(x,y,z);mesh.rotation.y=rotY;scene.add(mesh);return mesh;
  }
  function addExhibit(title,x,z,type){
    const base=cyl(.85,.95,.22,material(colors.darkStone),x,.12,z);base.userData={title,text:infoData[title]||'Informasi koleksi museum.'};interactables.push(base);
    if(type==='statue'){
      cyl(.45,.55,1.5,material(colors.gold, .4),x,.95,z);
      cyl(.33,.42,.6,material(colors.gold,.4),x,1.95,z);
      const head=cyl(.24,.24,.38,material(colors.gold,.4),x,2.44,z);head.rotation.z=.15;
      box(.95,.12,.3,material(colors.gold,.4),x,1.45,z);
    } else if(type==='artifact'){
      box(1.3,1.8,1.3,material(colors.glass,.12),x,1.05,z);
      const art=cyl(.3,.4,.8,material(colors.gold,.35),x,1.05,z);art.userData=base.userData;interactables.push(art);
    } else if(type==='astronomy'){
      const panel=box(1.9,1.35,.08,material(colors.blue,.5),x,1.2,z);panel.userData=base.userData;interactables.push(panel);
      for(let i=0;i<8;i++)cyl(.035,.035,.03,material(colors.gold,.3),x-0.65+(i%4)*.43,1.15+Math.floor(i/4)*.25,z-.06,16).rotation.x=Math.PI/2;
    } else {
      const relief=box(2.4,1.35,.12,material(colors.gold,.7),x,1.3,z);relief.userData=base.userData;interactables.push(relief);
      for(let i=0;i<4;i++)cyl(.16,.16,.08,material(colors.stone),x-.7+i*.46,1.3,z-.1,20).rotation.x=Math.PI/2;
    }
    label(title.toUpperCase(),x,2.35,z-.08,0);
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
    addExhibit('Patung Peradaban',0,-2,'statue');
    addExhibit('Artefak Kuno',-8,-7,'artifact');
    addExhibit('Galeri Astronomi',8,-7,'astronomy');
    addExhibit('Relief Sejarah',-8,7,'relief');
    addExhibit('Artefak Kuno',8,7,'artifact');
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
