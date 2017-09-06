var sceneRobo, sceneBG, camera, cameraBG, webGLRenderer;
var filter = /^(?:image\/bmp|image\/cis\-cod|image\/gif|image\/ief|image\/jpeg|image\/jpeg|image\/jpeg|image\/pipeg|image\/png|image\/svg\+xml|image\/tiff|image\/x\-cmu\-raster|image\/x\-cmx|image\/x\-icon|image\/x\-portable\-anymap|image\/x\-portable\-bitmap|image\/x\-portable\-graymap|image\/x\-portable\-pixmap|image\/x\-rgb|image\/x\-xbitmap|image\/x\-xpixmap|image\/x\-xwindowdump)$/i;
var fileReader = new FileReader();
var inner;
function init() {

    var stats = initStats();
    sceneRobo = new THREE.Scene();
    sceneBG = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    cameraBG = new THREE.OrthographicCamera(-window.innerWidth, window.innerWidth, window.innerHeight, -window.innerHeight, -10000, 10000);
//    cameraBG.position.z = 50;
    // create render
    webGLRenderer = new THREE.WebGLRenderer();
    webGLRenderer.setClearColor(new THREE.Color(0x000, 1.0));
    webGLRenderer.setSize(window.innerWidth, window.innerHeight);
    webGLRenderer.shadowMap.enabled = true;

    var robo;
    var loader = new THREE.JSONLoader();
    loader.load('asset/robo.js', function (geometry, mat) {
        robo = new THREE.SkinnedMesh(geometry, mat[0]);
        robo.scale.x = 110;
        robo.scale.y = 110;
        robo.scale.z = 110;
        geometry.center();
        sceneRobo.add(robo);
    });

    // position the camera 
    camera.position.x = 100;
    camera.position.y = 80;
    camera.position.z = 100;

    var orbitControls = new THREE.OrbitControls(camera);

    //for rotation
    var clock = new THREE.Clock();
    var delta = clock.getDelta();

    var ambientLight = new THREE.AmbientLight(0x383838);
    sceneRobo.add(ambientLight);

    // add spotlight
    var spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(300, 300, 300);
    spotLight.intensity = 0.8;
    sceneRobo.add(spotLight);

    fileReader.onload = function (event) {
        try {
            localStorage.setItem("b", event.target.result);
        } catch (DOMException) {
            alert("Image size too large! Choose another image or clear localStorage.")
        }
        try {
            switchBackground();
        } catch (e) {
            console.log(e);
        }
        location.reload();
    };

    //declare local storage chosen file
    var backgroundImagePath = localStorage.getItem("b");

    //set custom background
    function switchBackground()
    {
        var background = new THREE.MeshBasicMaterial({
            map: THREE.ImageUtils.loadTexture(backgroundImagePath),
            depthTest: false
        });
        var bgPlane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), background);
        bgPlane.position.z = -100;
        bgPlane.scale.set(window.innerWidth * 2, window.innerHeight * 2, 1);
        sceneBG.add(bgPlane);
    }

    if (backgroundImagePath === null)
    {
        var background = new THREE.MeshBasicMaterial({
            map: THREE.ImageUtils.loadTexture("asset/bg/bg.jpg"),
            depthTest: false
        });
        var bgPlane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), background);
        bgPlane.position.z = -100;
        bgPlane.scale.set(window.innerWidth * 2, window.innerHeight * 2, 1);
        sceneBG.add(bgPlane);
    } else {
        $(switchBackground);
    }
    // append renderer output to HTML
    document.getElementById("WebGL").appendChild(webGLRenderer.domElement);
    //add two scenes together
    var bgPass = new THREE.RenderPass(sceneBG, cameraBG);
    var renderPass = new THREE.RenderPass(sceneRobo, camera);
    renderPass.clear = false;
    var effectCopy = new THREE.ShaderPass(THREE.CopyShader);
    effectCopy.renderToScreen = true;

    // render 2 scenes to one image
    var composer = new THREE.EffectComposer(webGLRenderer);
    composer.renderTarget1.stencilBuffer = true;
    composer.addPass(bgPass);
    composer.addPass(renderPass);
    composer.addPass(effectCopy);

    //add controls
    var panel = new function () {
        this.rotate = true;

        this.savePosition = function () {
            var setPositionObject = {
                camPosition: camera.position.clone(),
                camPan: orbitControls.target.clone()
            }
            var setPositionJson = JSON.stringify(setPositionObject);
            localStorage.setItem("positionJson", setPositionJson);
            console.log(setPositionJson);
            alert("Position saved!");
        };

        this.restorePosition = function () {
            var getPositionJson = localStorage.getItem("positionJson");
            var getPositionObject = JSON.parse(getPositionJson);

            //restore camera position and orbitControls target
            camera.position.set(getPositionObject.camPosition.x, getPositionObject.camPosition.y, getPositionObject.camPosition.z);
            orbitControls.target.set(getPositionObject.camPan.x, getPositionObject.camPan.y, getPositionObject.camPan.z);

            console.log(getPositionObject);
        };
    };
    var gui = new dat.GUI();
    gui.add(panel, "rotate");
    gui.add(panel, "savePosition");
    gui.add(panel, "restorePosition");

    render();
    function render() {
        webGLRenderer.autoClear = false;
        stats.update();
        orbitControls.update(delta);
        if (panel.rotate) {
            if (robo) {
                try {
                    robo.rotation.y += 0.001;
                } catch (e) {
                    console.log("Rotation error");
                }
            }
        }
        // render using requestAnimationFrame
        requestAnimationFrame(render);
        composer.render(delta);
        composer.render();
    }

    function initStats() {

        var stats = new Stats();
        stats.setMode(0); // 0: fps, 1: ms

        // Align top-left
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.left = '0px';
        stats.domElement.style.top = '0px';
        document.getElementById("Stats").appendChild(stats.domElement);
        return stats;
    }
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    cameraBG.aspect = window.innerWidth / window.innerHeight;
    cameraBG.updateProjectionMatrix();
    webGLRenderer.setSize(window.innerWidth, window.innerHeight);
}

function loadImageFile(chosenFile) {
    if (!chosenFile.files.length) {
        return;
    }
    var oFile = chosenFile.files[0];
    if (!filter.test(oFile.type)) {
        alert("File format invalid!");
        return;
    }
    fileReader.readAsDataURL(oFile);
}

function removeImageFile() {
    localStorage.removeItem("b");
    location.reload();
}

window.onload = init;
window.addEventListener('resize', onResize, false);