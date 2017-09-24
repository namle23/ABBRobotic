var sceneRobo, sceneBG, camera, cameraBG, renderer;
var filter = /^(?:image\/bmp|image\/cis\-cod|image\/gif|image\/ief|image\/jpeg|image\/jpeg|image\/jpeg|image\/pipeg|image\/png|image\/svg\+xml|image\/tiff|image\/x\-cmu\-raster|image\/x\-cmx|image\/x\-icon|image\/x\-portable\-anymap|image\/x\-portable\-bitmap|image\/x\-portable\-graymap|image\/x\-portable\-pixmap|image\/x\-rgb|image\/x\-xbitmap|image\/x\-xpixmap|image\/x\-xwindowdump)$/i;
var fileReader = new FileReader();
function init() {

    var stats = initStats();
    sceneRobo = new THREE.Scene();
    sceneBG = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    cameraBG = new THREE.OrthographicCamera(-window.innerWidth, window.innerWidth, window.innerHeight, -window.innerHeight, -10000, 10000);
    // create render
    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(new THREE.Color(0x000, 1.0));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;

    var robo;
    var loader = new THREE.JSONLoader();
    loader.load("asset/robo5.js", function (geometry, mat) {
        mat.forEach(function (mat) {
            mat.skinning = true;
            mat.side = THREE.DoubleSide;
        });
        robo = new THREE.SkinnedMesh(geometry, mat);

        robo.scale.x = 60;
        robo.scale.y = 60;
        robo.scale.z = 60;
        sceneRobo.add(robo);
        helper = new THREE.SkeletonHelper(robo);
        helper.visible = false;
        sceneRobo.add(helper);
    });

    // position the camera 
    camera.position.x = 100;
    camera.position.y = 80;
    camera.position.z = 100;

    //declare orbitControl, renderer.domElement prevent mouse effect in dat.GUI area
    var orbitControls = new THREE.OrbitControls(camera, renderer.domElement);

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
    document.getElementById("WebGL").appendChild(renderer.domElement);
    //add two scenes together
    var bgPass = new THREE.RenderPass(sceneBG, cameraBG);
    var renderPass = new THREE.RenderPass(sceneRobo, camera);
    renderPass.clear = false;
    var effectCopy = new THREE.ShaderPass(THREE.CopyShader);
    effectCopy.renderToScreen = true;

    // render 2 scenes to one image
    var composer = new THREE.EffectComposer(renderer);
    composer.renderTarget1.stencilBuffer = true;
    composer.addPass(bgPass);
    composer.addPass(renderPass);
    composer.addPass(effectCopy);

    //add controls
    var controlPanel = new function () {
        this.rotate = false;

        //control bones
        this.bone_1 = 0;
        this.bone_2 = -1.5;
        this.bone_3 = 0;

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

    addControls(controlPanel);

    render();
    function render() {
        renderer.autoClear = false;
        stats.update();

        if (controlPanel.rotate) {
            if (robo) {
                try {
                    robo.rotation.y += 0.001;
                } catch (e) {
                    console.log("Rotation error");
                }
            }
        }

        try {
            robo.children[0].children[0].rotation.y = controlPanel.bone_1;
            robo.children[0].children[0].children[0].rotation.x = controlPanel.bone_2;
            robo.children[0].children[0].children[0].children[0].rotation.y = controlPanel.bone_3;
        } catch (e) {
            console.log("Bone control error");
        }

        // render using requestAnimationFrame
        requestAnimationFrame(render);
        composer.render(delta);
        composer.render();
        orbitControls.update();
    }

    function initStats() {

        var stats = new Stats();
        stats.setMode(0); // 0: fps, 1: ms

        // Align top-left
        stats.domElement.style.position = "absolute";
        stats.domElement.style.left = "0px";
        stats.domElement.style.top = "0px";
        document.getElementById("Stats").appendChild(stats.domElement);
        return stats;
    }
}

function addControls(controlObject) {
    var gui = new dat.GUI();
    gui.add(controlObject, "rotate");

    gui.add({helper: false}, 'helper').onChange(function (e) {
        helper.visible = e;
    });

    gui.add(controlObject, "bone_1", -1.5, 0).listen();
    gui.add(controlObject, "bone_2", -2, -1).listen();
    gui.add(controlObject, "bone_3", 0, 1.8).listen();

    gui.add(controlObject, "savePosition");
    gui.add(controlObject, "restorePosition");
}

function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    cameraBG.aspect = window.innerWidth / window.innerHeight;
    cameraBG.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
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