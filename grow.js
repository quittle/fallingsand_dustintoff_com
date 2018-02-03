// Copyright (c) 2016 Dustin Doloff
// Licensed under Apache License v2.0

/********************************************************
TODO: Make liquids fill things faster (low priority)
TODO: Add game mechanics
TODO: Add heat
TODO: Consider adding ashes from burnt plant
TODO: Make shrub shrubbier
TODO: Add wind?
TODO: Make liquids run properly
TODO: speed up game
********************************************************/

(function() {
    /*   ///////  // Variables //  ///////   */
    var particleSize = 5;
    var gameSpeed = 30;
    var inBackground = false;
    var opacity = 1; /* 0.0 - 1.0 are valid opacities */
    var defaultPenSize = 2;
    var penSize = 2;
    var holdForElement = false; /* If true, you must hold down the key for an element, otherwise it defaults to droplet */
    var shootDist = 30;
    var maxBulletSpeed = 2;
    var showPlayer = true;
    var playerMode = false; /* Restrict to within shootDist */
    var useGraphics = false; /* Super performance loss */
    var disableSelect = true; /* enabling prevents the user from accidentally highlighting things when drawing */

    var loadingText = 'Loading...';

    /** @type {!Object.<string, string>} */ const resource_root = RESOURCE_PATHS['projects']['fallingsand']['Grow'];
    var world = resource_root['world4.grw'];
    var imageLocation = resource_root['images'];

    var playerColor = '#ff0000';
    var bulletColor = '#000000';
    var plagueColor = '#004400';
    var steamColor = '#aaaaaa';
    var dropletColor = '#9999ff';
    var fireColor = '#ff6600';
    var smokeColor = '#777777';
    var growthColor = '#aaffaa';
    var wallColor = '#cccccc';
    var explosiveColor = '#cccc00';
    var liquidExplosiveColor = '#eeee00';
    var sandColor = '#efe4b0';
    var stickyColor = '#00bb00';
    var cloudColor = '#aaaadd';
    var lightningColor = '#ffff00';
    var iceColor = '#ddddff';
    var lavaColor = '#aa6622';
    var barkColor = '#994400';
    var shrubColor = '#ddaa55';
    var soilColor = '#bbbb88';
    var nutColor = '#ee9900';
    var genColor = '#000000';

    var numBullets = 50;
    var bulletExplosionRadius = 3;

    var genRate = .4; /* 1 is full, 0 is none */

    /* Element specific growth/spawn rate */
    var iceSpeed = .05;
    var growthSpeed = .5;
    var lavaSpeed = .01;

    var lavaCoolSpeed = .01; /* cool on solids */
    var lavaFireSpeed = .05; /* spawn fire rate */

    // var wallMeltLavaSpeed = .08;
    var wallMeltFireSpeed = .03;

    var cloudDropletSpeed = .15;
    var cloudLightningSpeed = .00003;

    var shrubBarkVertSpeed = .02;
    var shrubBarkHoriSpeed = .5;
    var shrubGrowBarkSpeed = .6;
    var shrubVertSpeed = .4;
    var shrubHoriSpeed = .6;
    var shrubHoriDist = 4;
    var shrubGrowthSpeed = .3;
    var shrubAgeSpeed = .05;
    /*  /////// // End Variables // ///////  */

    var canvas;
    var point;
    var body = document.body;

    init();
    if (disableSelect) {
        body.onselectstart = () => false;
        body.style.MozUserSelect = 'none';
    }

    var prevX, prevY, curX, curY;
    var gen;

    var growthImage;
    var dropletImage;
    var steamImage;
    var fireImage;
    var wallImage;
    var genImage;

    var particles;
    var modPart;
    var modInd;

    var updatedPart; /* 2 - dimensional array of true/false for if it is updated */
    var updatedPartList; /* 1 - dimensional array of indices of updated */
    var updatedInd; /* Iterate over updatedPartList */

    var isDown;
    var elemType;

    var player;

    /* Checks if the spot is covered in blocks so you don't click on a hidden link */
    function isClear(e) {
        try {
            var x = parseInt(e.clientX / particleSize, 10);
            var y = parseInt(e.clientY / particleSize, 10);
            return particles[x][y].fresh=='empty';
        } catch(e) {    return true; }
    }

    function reset() {
        point.clearRect(0, 0, window.innerWidth, window.innerHeight);
        particles = [];
        modPart = new Array(parseInt(window.innerWidth / particleSize + 1, 10) * parseInt(window.innerHeight / particleSize + 1, 10));
        modInd = 0;
        updatedInd = 0;
        updatedPart = new Array(parseInt(window.innerWidth/particleSize + 1, 10));
        for (var i = 0; i < parseInt(window.innerWidth / particleSize + 1, 10); i++) {
            updatedPart[i] = new Array(parseInt(window.innerHeight/particleSize + 1, 10));
            particles.push(new Array(parseInt(window.innerHeight/particleSize + 1, 10)));
            for (var j = 0 ; j < parseInt(window.innerHeight / particleSize + 1, 10); j++) {
                particles[i][j] = new Particulate();
            }
        }
        updatedPartList = new Array(updatedPart.length * updatedPart[0].length);
    }

    /* Returns the DOM object just beneath the canvas */
    function getBeneath(event) {
        if (!event)
            event = window.event;
        canvas.style.display='none';
        var starter = document.elementFromPoint(event.pageX - window.scrollX, event.pageY - window.scrollY);
        canvas.style.display='';
        return starter;
    }

    /** Called to initialize things */
    function init() {
        var clickevent = document.createEvent('MouseEvents');
        clickevent.initEvent('click', true, true);

        body.addEventListener('mousedown', function(event) { prevX = event.clientX; prevY = event.clientY; isDown = true; }, false);
        body.addEventListener('mouseup', function() { isDown = false; }, false);
        body.addEventListener('click', function(event) {
            if (isClear(event)) {
                try { getBeneath(event).dispatchEvent(clickevent); } catch (e) { }
            }
            mouseMove(event); }, false);
        body.addEventListener('mousemove', function(event) {    curX = event.clientX; curY = event.clientY; var ben = getBeneath(event); if (ben!=null && ben.nodeName=='A') canvas.style.cursor='pointer'; else if (ben!=null) canvas.style.cursor = ben.style.cursor; else canvas.style.cursor='default'; if (isDown) mouseMove(event); }, false);
        body.addEventListener('keydown', function(event) {    onKeyDown(event); }, false);
        body.addEventListener('keyup', function(event) {    gen = event.shiftKey; onKeyUp(event); if (holdForElement) { elemType='droplet'; }}, false);
        body.addEventListener('touchmove', function(event) {    touchMove(event); }, false);

        canvas = document.createElement('canvas');
        canvas.id = 'growthCanvas';
        point = canvas.getContext('2d');
        if (inBackground) {
            canvas.style.zIndex = -9999;
        } else {
            canvas.style.zIndex = 9998;
        }

        canvas.setAttribute('width', window.innerWidth + 'px');
        canvas.setAttribute('height', window.innerHeight + 'px');
        canvas.style.position = 'fixed';
        canvas.style.left = '0px';
        canvas.style.top = '0px';
        body.appendChild(canvas);

        point.globalAlpha = opacity;
        point.font = '90px Arial';
        point.fillText(loadingText, (window.innerWidth - point.measureText(loadingText).width)/2, window.innerHeight/2, window.innerWidth);

        point.fillStyle = '#cccccc';
        point.font = '85px Arial';
        point.fillText(loadingText, (window.innerWidth - point.measureText(loadingText).width)/2, (window.innerHeight - 2)/2, window.innerWidth);

        reset();

        player = new Player();
        for (var i = 0; i < numBullets; i++) {
            player.bullets[i] = new Bullet();
        }

        /* Load game */
        var client = new XMLHttpRequest();
        client.open('GET', world);
        var done = false;
        client.onreadystatechange = function() {
            var txt = client.responseText;

            while (txt != '' && done) {
                var x, y, width, height, type, shape, positioning;
                txt = txt.substring(txt.indexOf('<')+1);

                var tagType = txt.substring(0, txt.indexOf(' '));
                txt = txt.substring(txt.indexOf(' ')+1);
                if (tagType == 'elem') {
                    while (txt.indexOf('>')!=0) {
                        var property = txt.substring(0, txt.indexOf('='));
                        txt = txt.substring(txt.indexOf('="')+2);
                        var next = txt.indexOf('"');

                        if (property=='shape')
                            shape = txt.substring(0, next);
                        else if (property=='x')
                            x = parseFloat(txt.substring(0, next));
                        else if (property=='y')
                            y = parseFloat(txt.substring(0, next));
                        else if (property=='width')
                            width = parseFloat(txt.substring(0, next));
                        else if (property=='height')
                            height = parseFloat(txt.substring(0, next));
                        else if (property=='type')
                            type = txt.substring(0, next);
                        else if (property=='position')
                            positioning = txt.substring(0, next);

                        txt = txt.substring(next + 1);
                        while (txt.indexOf(' ')==0 || txt.indexOf('\t')==0 || txt.indexOf('\n')==0)
                            txt = txt.substring(1);
                    }
                } else if (tagType == 'player') {
                    while (txt.indexOf('>')!=0) {
                        var property = txt.substring(0, txt.indexOf('='));
                        txt = txt.substring(txt.indexOf('="')+2);
                        var next = txt.indexOf('"');

                        if (property=='x')
                            x = parseFloat(txt.substring(0, next));
                        else if (property=='y')
                            y = parseFloat(txt.substring(0, next));
                        else if (property=='position')
                            positioning = txt.substring(0, next);

                        txt = txt.substring(next + 1);
                        while (txt.indexOf(' ')==0 || txt.indexOf('\t')==0 || txt.indexOf('\n')==0)
                            txt = txt.substring(1);
                    }
                }

                txt = txt.substring(txt.indexOf('>')+1);

                var partWidth = window.innerWidth/particleSize;
                var partHeight = window.innerHeight/particleSize;
                if (tagType=='elem') {
                    if (positioning=='relative') {
                        if (shape=='rectangle')
                            rectanglePoint(parseInt(partWidth * x, 10), parseInt(partHeight * y, 10), partWidth * width, partHeight * height, type, true, []);
                        else if (shape=='circle')
                            circlePoint(parseInt(partWidth * x, 10), parseInt(partHeight * y, 10), parseInt(partWidth * width, 10), type, true, []);
                        else if (shape=='elipse')
                            elipsePoint(parseInt(partWidth * x, 10), parseInt(partHeight * y, 10), parseInt(partWidth * width, 10), parseInt(partHeight * height, 10), type, true, []);
                    } else if (positioning=='absolute') {
                        if (shape=='rectangle')
                            rectanglePoint(x, y, width, height, type, true, []);
                        else if (shape=='circle')
                            circlePoint(x, y, width, type, true, []);
                        else if (shape=='elipse')
                            elipsePoint(x, y, width, height, type, true, []);
                    }
                } else if (tagType=='player') {
                        point.clearRect(player.x * particleSize, player.y * particleSize, particleSize, particleSize);
                    if (positioning=='relative') {
                        player.x = parseInt(partWidth * x, 10);
                        player.y = parseInt(partHeight * y, 10);
                    } else if (positioning=='absolute') {
                        player.x = parseInt(x, 10);
                        player.y = parseInt(y, 10);
                    }

                }
            }
            done = true;
        };
        client.send();
        /* End load game */

        /* Load images images */
        growthImage = new Image();
        growthImage.opacity = opacity;
        growthImage.src = imageLocation['growth.png'];

        dropletImage = new Image();
        dropletImage.opacity = opacity;
        dropletImage.src = imageLocation['droplet.png'];

        steamImage = new Image();
        steamImage.opacity = opacity;
        steamImage.src = imageLocation['steam.png'];

        fireImage = new Image();
        fireImage.opacity = opacity;
        fireImage.src = imageLocation['fire.png'];

        wallImage = new Image();
        wallImage.opacity = opacity;
        wallImage.src = imageLocation['wall.png'];

        genImage = new Image();
        genImage.opacity = opacity;
        genImage.src = imageLocation['gen.png'];

        isDown = false;
        elemType = 'droplet';

        point.clearRect(0, 0, window.innerWidth, window.innerHeight);
        setTimeout(update, gameSpeed);
    }

    /**
     * Called when a key is pressed
     * @param {!Event} e The event that triggered this callback
     */
    function onKeyDown(e) {
        var code = e.keyCode;
        if (code == 9) /* tab */
            setInterval(() => act(compressParticles()), 1000);
        else if (code == 37)            /* Arrow Keys */
            player.move = -1;
        else if (code == 39)
            player.move = 1;
        else if (code == 38)
            if (player.jump == 0 && !player.hasJumped) {
                player.hasJumped = true;
                player.jump = 5;
            }
        if (code == 17 && showPlayer) /* CTRL key */
            circlePoint(player.x, player.y, 5, elemType, true, []);
        else if (code == 27) {     /* Escape */
            alert('updatedPart: ' + updatedPart[parseInt(curX / particleSize, 10)][parseInt(curY / particleSize, 10)] + '\npariticles: ' + particles[parseInt(curX / particleSize, 10)][parseInt(curY / particleSize, 10)].fresh);
            var x = parseInt(curX / particleSize, 10);
            var y = parseInt(curY / particleSize, 10);
                var count = 0;
                for (var i = -1; i < 2; i++)
                    for (var j = -1; j < 2; j++)
                        if (x + i < 0 || x + i > particles.length || y + j < 0 || y + j >particles[0].length || isSolid(particles[x + i][y + j].fresh))
                            count++;
                alert(count);
        }
        else if (code == 32) /* Space */
            player.fireBullet();
        else if (code == 48) /* 0 */
            penSize = defaultPenSize;
        else if (code >= 49 && code <= 57) /* 1 - 9 */
            penSize = code - 48;
        else if (code == 65)
            elemType = 'sand';
        else if (code == 66)
            elemType = 'bark';
        else if (code == 67)
            elemType = 'cloud';
        else if (code == 68)
            elemType = 'droplet';
        else if (code == 69)
            elemType = 'eraser';
        else if (code == 70)
            elemType = 'fire';
        else if (code == 71)
            elemType = 'growth';
        else if (code == 72)
            elemType = 'shrub';
        else if (code == 73)
            elemType = 'ice';
        else if (code == 75)
            elemType = 'cloak';
        else if (code == 76)
            elemType = 'lightning';
        else if (code == 77)
            elemType = 'smoke';
        else if (code == 78)
            elemType = 'nut';
        else if (code == 79)
            elemType = 'soil';
        else if (code == 80)
            elemType = 'plague';
        else if (code == 83)
            elemType = 'steam';
        else if (code == 84)
            elemType = 'sticky';
        else if (code == 86)
            elemType = 'lava';
        else if (code == 87)
            elemType = 'wall';
        else if (code == 88)
            elemType = 'explosive';
        else if (code == 90)
            elemType = 'liquidExplosive';
        else if (code == 192) {     /*~*/
            setInterval(function() {
                var ret = act('');
                reset();
                var elem = ret.substring(0, 1);
                ret = ret.substring(1);
                while (ret!='') {
                    while (ret.indexOf(';')!=0) {
                        var x = ret.substring(0, 3);
                        ret = ret.substring(3);
                        var y = ret.substring(0, 3);
                        ret = ret.substring(3);
                        forcePoint(parseInt(x, 10), parseInt(y, 10), decompressElem(elem));
                    }
                    elem = ret.substring(1, 2);
                    ret = ret.substring(2);
                }
            }, 1000);

        }
        /* Set gen if the shiftkey is down */
        gen = e.shiftKey;
    }

    /**
     * Callback for the keyUp event
     * @param {!Event} e The event that triggered this callback
     */
    function onKeyUp(e) {
        let code;
        if (e.keyCode) {
            code = e.keyCode;
        } else if (e.which) {
            code = e.which;
        }

        if (code == 37 || code == 39) {
            player.move = 0;
        }
    }

    /**
     * An instance of a type of particle. Holds it's current and previous type
     * @constructor
     */
    function Particulate() {
        this.old = 'empty';
        this.fresh = 'empty';
    }

    /**
     * A pixel-player that moves and jumps around and shoots bullets
     * @constructor
     */
    function Player() {
        this.x = 50;
        this.y = 50;
        this.move = 0;
        this.jump = 0;
        this.hasJumped = false;
        this.bullets = new Array(numBullets);
        this.fireBullet = function() {
            for (var i = 0; i < numBullets; i++) {
                var bullet = player.bullets[i];
                if (bullet.x < 0 || bullet.y < 0 || bullet.x > particles.length || bullet.y > particles[0].length) {
                    var x = curX/particleSize;
                    var y = curY/particleSize;
                    var magnitude = Math.sqrt(Math.pow(x - player.x, 2) + Math.pow(y - player.y, 2));
                    if (magnitude>maxBulletSpeed)
                        magnitude /= maxBulletSpeed;
                    else
                        magnitude = 1;
                    bullet.velX = (x - player.x)/magnitude;
                    bullet.velY = (y - player.y)/magnitude;
                    bullet.x = player.x;
                    bullet.y = player.y;
                    bullet.elem = elemType;
                    return;
                }
            }
        };
    }

    /**
     * A bullet shot that moves in a direction. Upon impact, it explodes into a ball of particles
     * @constructor
     */
    function Bullet() {
        this.x = -1;
        this.y = -1;
        this.velX = 0;
        this.velY = 0;
        this.elem = 'fire';
    }

    /* Called when their is a touch event for mobile devices */
    function touchMove(evt) {
        try {
            evt.preventDefault();
            var touches = evt.changedTouches;
            for (var i = 0;i<touches.length;i++) {
                circlePoint(parseInt(touches[i].clientX / particleSize, 10), parseInt(touches[i].clientY / particleSize, 10), penSize, getElem(), true, []);
            }
        } catch(e) { }
    }

    /* Called when the mouse moves to allow you to draw stuff */
    function mouseMove(event) {
        if (event.clientX!=0 || event.clientY!=0) {
            if (playerMode) {
                prevX = event.clientX;
                prevY = event.clientY;
                move();
            } else {
                var x = parseInt(event.clientX, 10);
                var y = parseInt(event.clientY, 10);
                do {
                    circlePoint(parseInt(x / particleSize, 10), parseInt(y / particleSize, 10), penSize, getElem(), true, []);
                    if (Math.abs(x - prevX)>=particleSize)
                        x += particleSize*(x - prevX<0?1:-1);
                    if (Math.abs(y - prevY)>=particleSize)
                        y += particleSize*(y - prevY<0?1:-1);
                } while (Math.abs(x - prevX) >= particleSize || Math.abs(y - prevY) >= particleSize);
            }
            prevX = event.clientX;
            prevY = event.clientY;
        }
    }

    function move() {
        var x = parseInt(prevX, 10) / particleSize;
        var y = parseInt(prevY, 10) / particleSize;
        var magnitude = Math.sqrt(Math.pow(x - player.x, 2) + Math.pow(y - player.y, 2));
        if (magnitude>shootDist)
            magnitude /= shootDist;
        else
            magnitude = 1;
        x = player.x + (x - player.x) / magnitude;
        y = player.y + (y - player.y) / magnitude;

        circlePoint(parseInt(x, 10), parseInt(y, 10), penSize, getElem(), true, []);
    }

    /* converts the given elem to a valid elem type */
    function getElem() {
        if (gen && elemType != 'plague' && !isSolid(elemType))
            return elemType + 'Gen';
        else if (elemType == 'eraser')
            return 'empty';
        else
            return elemType;
    }

    /* Called repeatedly, handles everything */
    function update() {
        for (modInd--;modInd>=0;modInd--) {
            updateAction(modPart[modInd][0], modPart[modInd][1]);
        }
        modInd = 0;
        if (showPlayer)
            try { updatePlayer(); } catch (e) { }
        draw();
        setTimeout(update, gameSpeed);
    }

    /**
     * Causes things on the field to 'act'
     * @param {number} x The x-coordinate
     * @param {number} y The y-coordinate
     */
    function updateAction(x, y) {
        var particulate = particles[x][y];
        if (!particulate)
            return;
        var elem = particulate.fresh;
        if (elem=='empty' || elem=='wall' || elem=='growth' || elem=='ice' || elem=='explosive' || elem=='bark' || elem=='cloak')
            return;

        else if (elem ==' plague') {
            var move = Math.floor(Math.random()*4);
            if (move == 0)
                changePoint(x, y - 1, 'plague');
            else if (move == 1)
                changePoint(x, y + 1, 'plague');
            else if (move == 2)
                changePoint(x - 1, y, 'plague');
            else if (move == 3)
                changePoint(x + 1, y, 'plague');

            if (Math.random()<.25)
                changePoint(x, y, 'empty');
        } else if (elem=='steam') {
            var move = Math.floor(Math.random()*100);
            if (move>=60)
                changePoint(x, y - 1, 'steam');
            else if (move>=50)
                changePoint(x - 1, y, 'steam');
            else if (move>=40)
                changePoint(x + 1, y, 'steam');
            else if (move == 1)
                changePoint(x, y, 'droplet');

            if (move>=40)
                changePoint(x, y, 'empty');
        } else if (elem=='cloud') {
            var x2=-1, y2=-1;
            var move = Math.floor(Math.random()*300);
            if     (move<20) {    x2 = x; y2 = y-1; }
            else if (move<40) {    x2 = x; y2 = y+1; }

            else if (move<60) {    x2 = x+1; y2 = y; }
            else if (move<80) {    x2 = x-1; y2 = y; }

            else if (move<100) {    x2 = x-1; y2 = y+1; }
            else if (move<120) {    x2 = x-1; y2 = y-1; }

            else if (move<140) {    x2 = x+1; y2 = y-1; }
            else if (move<160) {    x2 = x+1; y2 = y+1; }


            else if (move>265) /* 25 & 4 // 278 & 5 //6 is too tight, makes a square */
                changePoint(x, y, 'empty');

            if (x2!=-1) {
                var sum = 0;
                for (var i=-1;i<2;i++)
                    for (var j=-1;j<2;j++)
                        try { if (particles[x + i][y + j].fresh == 'cloud') {
                            sum++;
                        } } catch (e) { }
                if (sum>4) {
                    changePoint(x2, y2, 'cloud');
                }
            }
            var spawn = Math.random();
            if (spawn<cloudLightningSpeed)
                changePoint(x, y + 1, 'lightning');
            if (spawn<cloudDropletSpeed && particulate.old == 'empty') {
                changePoint(x, y + 1, 'droplet');
            }
        } else if (elem=='lightning') {
            setTimeout(forcePoint, gameSpeed, x, y, 'empty');
            var move = Math.random()*5;
            if (move<1) {
                move = Math.floor(move * 11)-5;
                changePoint(move + x, y + 1, 'lightning');
                updateAction(move + x, y + 1);
            }
            else{
                changePoint(x, y + 1, 'lightning');
                updateAction(x, y + 1);
            }
        } else if (elem=='sticky' || elem=='droplet' || elem=='sand' || elem=='lava' || elem=='liquidExplosive' || elem=='soil' || elem=='nut') {
            if (elem=='sticky') {
                for (var i=-1;i<2;i++)
                    for (var j=-1;j<2;j++)
                        try { if ((i == 0 || j == 0) && isSolid(particles[x + i][y + j].fresh) || (isSticky(particles[x + i][y + j].fresh) && (!isLiquid(particles[x + i][y + j].fresh) || isClumpy(particles[x + i][y + j].fresh)))) {
                            continue;
                        } } catch (e) { }
            }
            var type = particulate.fresh;
            if (elem=='lava') {
                var lavaSum = 0;
                var solidSum = 0;
                for (var i=-1;i<2;i++)
                    for (var j=-1;j<2;j++)
                        try {
                            if (particles[x + i][y + j].fresh == 'lava')
                                lavaSum++;
                            else if (isSolid(particles[x + i][y + j].fresh))
                                solidSum++;
                        } catch (e) { }
                if (lavaSum<7 && solidSum>1 && Math.random()<lavaCoolSpeed) {
                    forcePoint(x, y, 'wall');
                } else {
                    changePoint(x, y, 'empty');
                    changePoint(x, y + 1, 'lava');
                }
                if (Math.random()<lavaFireSpeed)
                    changePoint(x, y, 'fire');
            } else {
                changePoint(x, y, 'empty');
                changePoint(x, y + 1, type);
            }
        } else if (elem=='fire') {
            var move = Math.floor(Math.random()*9);
            if (move%3 == 0)
                changePoint(x, y - 1, 'fire');
            if (move<1)
                changePoint(x, y - 3, 'smoke');
            if (move>6)
                changePoint(x + 1, y, 'fire');
            if (move<2)
                changePoint(x - 1, y, 'fire');
            if (move == 0)
                changePoint(x, y - 1, 'fire');
            changePoint(x, y, 'empty');
        } else if (elem=='smoke') {
            var move = Math.floor(Math.random()*9);
            var amount = Math.floor(Math.random()*5)-2;
            if (move>7)
                changePoint(x, y - Math.abs(amount), 'smoke');
            if (move<6)
                changePoint(x, y, 'empty');
            if (move>6)
                changePoint(x + amount, y, 'smoke');
            if (move<2)
                changePoint(x - amount, y, 'smoke');
        } else if (elem=='shrub') {
            var grow = Math.random();
            if (grow<shrubVertSpeed && y - 1>=0 && particles[x][y - 1].fresh == 'empty')
                changePoint(x, y - 1, 'shrub');
            grow = Math.random();
            if (grow<shrubHoriSpeed) {
                var maxDist = Math.ceil(Math.random()*shrubHoriDist);
                var dist = 0;
                grow = Math.random();
                try {
                    if (grow>.5) {
                        while (dist++<maxDist && particles[x + dist][y].fresh=='empty') {
                            changePoint(x + dist, y, 'shrub');
                            if (particles[x + dist][y + 1].fresh=='empty')
                                changePoint(x + dist, y + 1, 'bark');
                            if (Math.random()<.5 && particles[x + dist][y - 1].fresh=='empty')
                                changePoint(x + dist, y - 1, 'bark');
                        }
                    } else {
                        while (dist++<maxDist && particles[x - dist][y].fresh=='empty') {
                            changePoint(x - dist, y, 'shrub');
                            if (particles[x - dist][y + 1].fresh=='empty')
                                changePoint(x - dist, y + 1, 'bark');
                            if (Math.random()<shrubGrowBarkSpeed && particles[x - dist][y - 1].fresh=='empty')
                                changePoint(x - dist, y - 1, 'bark');
                        }
                    }
                } catch (e) { }
            }
            var count = 0;
            for (var i=-1;i<2;i++)
                for (var j=-1;j<2;j++) {
                    try {
                        if (x + i<0 || x + i>particles.length || y + j<0 || y + j>particles[0].length || isSolid(particles[x + i][y + j].fresh))
                            count++;
                        if (x + i>=0 && x + i<particles.length && y + j>=0 && y + j<particles[0].length)
                            if ((i + j)%2 == 0 && particles[x + i][y + j].fresh=='empty')
                                if (j!=0 && Math.random()<shrubBarkVertSpeed)
                                    changePoint(x + i, y + j,'bark');
                                else if (Math.random()<shrubBarkHoriSpeed)
                                    changePoint(x + i, y + j,'bark');
                            else if (Math.random()<shrubGrowthSpeed && particles[x + i][y + j].fresh=='empty')
                                changePoint(x + i, y + j,'growth');
                    } catch(e) { }
                }
            if (count>=8 && Math.random()<shrubAgeSpeed) {
                forcePoint(x, y, 'bark');
            }
        } else if (isGen(elem) && isGas(particulate.fresh.substring(0, particulate.fresh.indexOf('Gen')))) {
                changePoint(x, y - 1, particulate.fresh.substring(0, particulate.fresh.indexOf('Gen')));
                updateAction(x, y - 1);
        } else if (isGen(elem) && (elem=='lightningGen' ||
        (particulate.fresh.substring(0, particulate.fresh.indexOf('Gen'))))) {
            var act = Math.random();
            if (particles[x][y + 1] && particles[x][y + 1].fresh == 'empty' && act < genRate) {
                changePoint(x, y + 1, particulate.fresh.substring(0, particulate.fresh.indexOf('Gen')));
            }
        }
        forcePoint(x, y, particles[x][y].fresh);
    }

    function draw() {
        while (updatedInd-->0) {
            var x = updatedPartList[updatedInd][0];
            var y = updatedPartList[updatedInd][1];
            updatedPart[x][y] = false;

            var particulate = particles[x][y];
            var image = '';
            switch(particulate.fresh) {
                case 'empty':
                case 'cloak':
                    point.clearRect(x * particleSize, y * particleSize, particleSize, particleSize);
                    continue;
                case 'plague':
                    point.fillStyle = plagueColor;
                    modPart[modInd++] = new Array(x, y);
                    break;
                case 'steam':
                    point.fillStyle = steamColor;
                    modPart[modInd++] = new Array(x, y);
                    image = steamImage;
                    break;
                case 'droplet':
                    point.fillStyle = dropletColor;
                    modPart[modInd++] = new Array(x, y);
                    image = dropletImage;
                    break;
                case 'fire':
                    point.fillStyle = fireColor;
                    modPart[modInd++] = new Array(x, y);
                    image = fireImage;
                    break;
                case 'smoke':
                    point.fillStyle = smokeColor;
                    modPart[modInd++] = new Array(x, y);
                    break;
                case 'growth':
                    point.fillStyle = growthColor;
                    image = growthImage;
                    break;
                case 'wall':
                    point.fillStyle = wallColor;
                    image = wallImage;
                    break;
                case 'explosive':
                    point.fillStyle = explosiveColor;
                    break;
                case 'liquidExplosive':
                    point.fillStyle = liquidExplosiveColor;
                    modPart[modInd++] = new Array(x, y);
                    break;
                case 'sand':
                    point.fillStyle = sandColor;
                    modPart[modInd++] = new Array(x, y);
                    break;
                case 'sticky':
                    point.fillStyle = stickyColor;
                    modPart[modInd++] = new Array(x, y);
                    break;
                case 'cloud':
                    point.fillStyle = cloudColor;
                    modPart[modInd++] = new Array(x, y);
                    break;
                case 'lightning':
                    point.fillStyle = lightningColor;
                    modPart[modInd++] = new Array(x, y);
                    break;
                case 'ice':
                    point.fillStyle = iceColor;
                    break;
                case 'lava':
                    point.fillStyle = lavaColor;
                    modPart[modInd++] = new Array(x, y);
                    break;
                case 'bark':
                    point.fillStyle = barkColor;
                    break;
                case 'shrub':
                    point.fillStyle = shrubColor;
                    modPart[modInd++] = new Array(x, y);
                    break;
                case 'soil':
                    point.fillStyle = soilColor;
                    modPart[modInd++] = new Array(x, y);
                    break;
                case 'nut':
                    point.fillStyle = nutColor;
                    modPart[modInd++] = new Array(x, y);
                    break;
                case 'dropletGen':
                case 'steamGen':
                case 'fireGen':
                case 'smokeGen':
                case 'sandGen':
                case 'liquidExplosiveGen':
                case 'lightningGen':
                case 'cloudGen':
                case 'stickyGen':
                case 'lavaGen':
                case 'soilGen':
                case 'nutGen':
                    modPart[modInd++] = new Array(x, y);
                    point.fillStyle = genColor;
                    break;
            }
            if (image == '' || !useGraphics) {
                point.fillRect(x * particleSize, y * particleSize, particleSize, particleSize);
            } else {
                point.drawImage(image, x * particleSize, y * particleSize, particleSize, particleSize);
            }
        }

        updatedInd = 0;
        if (showPlayer) {
            /* Draw Player */
            point.fillStyle = playerColor;
            point.fillRect(player.x * particleSize, player.y * particleSize, particleSize, particleSize);
            /* Draw Bullet */
            point.fillStyle = bulletColor;
            for (var i = 0;i<numBullets;i++) {
                point.fillRect(player.bullets[i].x * particleSize, player.bullets[i].y * particleSize, particleSize, particleSize);
            }
        }
    }

    function updatePlayer() {
        forcePoint(player.x, player.y, particles[player.x][player.y].fresh);

        player.x += player.move;
        try {
            var particle = particles[player.x][player.y];
            if (particle && isSolid(particle.fresh)) {
                player.x -= player.move;
            }
        } catch (e) { }

        player.y += 1;
        try {
            particle = particles[player.x][player.y];
            if (particle && isSolid(particle.fresh)) {
                player.y -= 1;
                player.hasJumped = false;
            }
        } catch (e) { }


        if (player.jump > 0) {
            player.y -= 2;
            player.jump -= 1;
            try {
                particle = particles[player.x][player.y];
                if (particle && isSolid(particle.fresh)) {
                    player.y += 1;
                    player.jump = 0;
                }
                particle = particles[player.x][player.y];
                if (particle && isSolid(particle.fresh)) {
                    player.y += 1;
                    player.jump = 0;
                }
            } catch (e) { }
        }

        for (var i = 0;i<numBullets;i++) {
            var bullet = player.bullets[i];
            point.clearRect(bullet.x * particleSize, bullet.y * particleSize, particleSize, particleSize);
            bullet.x += bullet.velX;
            bullet.y += bullet.velY;
            var x = Math.floor(bullet.x);
            var y = Math.floor(bullet.y);
            try {
                if (isSolid(particles[x][y].fresh) || particles[x][y].fresh == 'sticky' || getDensity(particles[x][y].fresh)>getDensity('droplet')) {
                    circlePoint(x, y, bulletExplosionRadius, bullet.elem, true, ['growth','explosive','liquidExplosive', 'cloak']);
                    player.bullets[i] = new Bullet();
                } else {
                    x = Math.ceil(bullet.x);
                    y = Math.ceil(bullet.y);
                    if (isSolid(particles[x][y].fresh) || particles[x][y].fresh == 'sticky' || getDensity(particles[x][y].fresh)>getDensity('droplet')) {
                        circlePoint(x, y, bulletExplosionRadius, bullet.elem, true, ['growth','explosive','liquidExplosive', 'cloak']);
                        player.bullets[i] = new Bullet();
                    }
                }
            } catch(e) { }
        }
    }

    function forcePoint(x, y, type) {
        try {
            var particle = particles[x][y];
            particle.old = particle.fresh;
            particle.fresh = type;

            if (updatedPart[x][y]!=true) {
                updatedPart[x][y] = true;
                updatedPartList[updatedInd++] = new Array(x, y);
            }
        } catch(e) {}
    }

    function changePoint(x, y, type) {
        try {
            var particle = particles[x][y];
            particle.old = particle.fresh;
            particle.fresh = type;
            if (particle.old == particle.fresh)
                forcePoint(x, y, type);

            if (updatedPart[x][y]!=true) {
                updatedPart[x][y] = true;
                updatedPartList[updatedInd++] = new Array(x, y);
            }

            if (type == 'droplet') {
                for (var i=-1;i<2;i++)
                    for (var j=-1;j<2;j++)
                        if (particles[x + i][y + j].fresh == 'growth' && Math.random()<growthSpeed) {
                            setTimeout(changePoint, gameSpeed * 3, x, y, 'growth');
                        } else if (particles[x + i][y + j].fresh == 'ice' && Math.random()<iceSpeed) {
                            setTimeout(changePoint, gameSpeed * 3, x, y, 'ice');
                        } else if (particles[x + i][y + j].fresh == 'lava') {
                            setTimeout(changePoint, gameSpeed, x + i, y + j, 'wall');
                            setTimeout(changePoint, gameSpeed, x, y, 'steam');
                        }

                if (particle.old == 'fire') {
                    forcePoint(x, y, 'steam');
                    return true;
                }
                else if (particle.old == 'lava') {
                    changePoint(x, y, 'wall');
                    changePoint(x, y - 1, 'steam');
                    return true;
                }
                else if (particle.old == 'growth' || particle.old == 'ice') {
                    forcePoint(x, y, particle.old);
                    if ((particle.fresh=='growth' && Math.random()<growthSpeed) || (particle.fresh=='ice' && Math.random()<iceSpeed)) {
                        var grow = Math.floor(Math.random()*10);
                        setTimeout(changePoint, gameSpeed, x, y - 1, particle.fresh);
                        if (grow == 9)
                            setTimeout(changePoint, gameSpeed, x - 1, y - 1, particle.fresh);
                        if (grow<7)
                            setTimeout(changePoint, gameSpeed, x - 1, y, particle.fresh);
                        if (grow>2)
                            setTimeout(changePoint, gameSpeed, x + 1, y, particle.fresh);
                        if (grow == 0)
                            setTimeout(changePoint, gameSpeed, x + 1, y - 1, particle.fresh);
                    } else {
                        changePoint(x, y - 1, 'droplet');
                    }
                    return true;
                }
                else if (particle.old == 'cloud') {
                    forcePoint(x, y, 'cloud');
                    return true;
                }
                else if (particle.old == 'sand') {
                    forcePoint(x, y, 'soil');
                    return true;
                }
            }
            if (type == 'fire') {
                if (isCombustible(particle.old)) {
                    setTimeout(circlePoint, gameSpeed, x, y, 10, 'fire', true, ['explosive', 'liquidExplosive', 'droplet']);
                    return true;
                }

                if (particle.old == 'droplet') {
                    changePoint(x, y, 'steam');
                    return true;
                }
                else if (isFlammable(particle.old)) {
                    var burn = Math.floor(Math.random()*5);
                    if (burn<4)
                        setTimeout(changePoint, gameSpeed, x, y - 1, 'fire');
                    if (burn<3)
                        setTimeout(changePoint, gameSpeed, x - 1, y, 'fire');
                    if (burn>1)
                        setTimeout(changePoint, gameSpeed, x + 1, y, 'fire');
                    if (burn<2)
                        setTimeout(changePoint, gameSpeed * 3, x, y + 1, 'fire');
                    return true;
                }
                else if (particle.old == 'ice') {
                    forcePoint(x, y, 'steam');
                    return true;
                }
                else if (particle.old == 'wall') {
                    if (Math.random()<wallMeltFireSpeed) {
                        changePoint(x, y, 'lava');
                        return true;
                    }
                }
                else if (particle.old == 'smoke') {
                    forcePoint(x, y, 'fire');
                    return true;
                }
                else if (particle.old == 'soil') {
                    forcePoint(x, y, 'sand');
                    changePoint(x, y - 1, 'steam');
                    return true;
                }
            }
            if (type == 'lava') {
                for (var i=-1;i<2;i++)
                    for (var j=-1;j<2;j++)
                        /* if (particles[x + i][y + j].fresh=='wall' && Math.random()<wallMeltLavaSpeed) {
                            setTimeout(forcePoint, gameSpeed, x + i, y + j, 'lava');
                        } else */ if (isFlammable(particles[x + i][y + j].fresh) && Math.random()<lavaSpeed) {
                            setTimeout(changePoint, gameSpeed * 3, x + i, y + j, 'wall');
                            setTimeout(changePoint, gameSpeed * 3, x + i, y + j-1, 'fire');
                        }

                if (isCombustible(particle.old)) {
                    setTimeout(circlePoint, gameSpeed, x, y, 10, 'fire', true, ['explosive', 'liquidExplosive', 'droplet']);
                    return true;
                }

                /* if (particle.old == 'wall') {
                    if (Math.random()<wallMeltLavaSpeed)
                        setTimeout(forcePoint, gameSpeed, x, y, 'lava');
                    else{
                        forcePoint(x, y, 'wall');
                        forcePoint(x, y - 1, 'wall');
                    }
                    return true;
                }
                else */ if (isFlammable(particle.old)) {
                    changePoint(x, y - 1, 'fire');
                    changePoint(x, y + 1, 'fire');
                    forcePoint(x, y, 'wall');
                    return true;
                }
                else if (particle.old == 'droplet') {
                    changePoint(x, y, 'wall');
                    changePoint(x, y - 1, 'steam');
                    return true;
                }
                else if (particle.old == 'ice') {
                    changePoint(x, y - 1, 'wall');
                    changePoint(x, y, 'droplet');
                    return true;
                }
                else if (particle.old == 'soil') {
                    forcePoint(x, y, 'wall');
                    changePoint(x, y - 1, 'lava');
                    return true;
                }
            }
            if (type == 'steam') {
                if (particle.old == 'ice') {
                    forcePoint(x, y, 'ice');
                    var condense = Math.floor(Math.random()*10);
                    if (condense == 9)
                        setTimeout(changePoint, gameSpeed, x - 1, y + 1, 'droplet');
                    if (condense == 0)
                        setTimeout(changePoint, gameSpeed, x + 1, y + 1, 'droplet');
                    return true;
                }
                if (particle.old == 'sand') {
                    forcePoint(x, y, 'soil');
                    return true;
                }
            }
            if (type == 'smoke') {
                if (particle.old == 'fire' || particle.old == 'steam') {
                    forcePoint(x, y, particle.old);
                    return true;
                }
            }
            if (type == 'lightning') {
                if (isCombustible(particle.old) || isSolid(particle.old))
                    circlePoint(x, y, 3, 'fire', false, []);
                else if (particle.old != 'empty' && particle.old != 'lightning' && particle.old != 'droplet' && particle.old != 'fire' && !isGas(particle.old))
                    forcePoint(x, y, particle.old);
                return true;
            }
            if (type == 'shrub') {
                if (particle.old == 'fire' || isSolid(particle.old)) {
                    forcePoint(x, y, particle.old);
                    return true;
                }
            }
            if (type == 'sand') {
                if (particle.old == 'droplet') {
                    forcePoint(x, y, 'soil');
                    return true;
                }
            }
            if (type == 'soil') {
                if (particle.old == 'nut') {
                    circlePoint(x, y, 3, 'shrub', false, ['soil','sand','droplet']);
                }
            }
            if (type == 'nut') {
                if (particle.old == 'soil') {
                    circlePoint(x, y, 3, 'shrub', false, ['soil', 'sand', 'droplet', 'nut']);
                }
            }

            /**************  BEGIN GENERAL CASE HANDLING  **************/
            if (isSolid(particle.old) && isLiquid(type)) {
                forcePoint(x, y, particle.old);

                var flow;
                if (particles[x - 1][y - 1].fresh == 'empty')
                    if (particles[x + 1][y - 1].fresh == 'empty')
                        flow = Math.floor(Math.random()*3)-1;
                    else
                        flow = Math.floor(Math.random()*2)-1;
                else
                    if (particles[x + 1][y - 1].fresh == 'empty')
                        flow = Math.floor(Math.random()*2);
                    else
                        flow = 0;
                changePoint(x + flow, y - 1, type);
                return true;
            }
            if (isLiquid(particle.old) && isLiquid(type)) {
                if (getDensity(particle.old) >= getDensity(type)) {     /* e.g. droplet falling onto soil */
                    forcePoint(x, y, particle.old);
                    var flow = Math.floor(Math.random()*4);
                    if (flow <=1 && ((isLiquid(particles[x - 1][y - 1].fresh) && (getDensity(particles[x - 1][y - 1].fresh) < getDensity(particle.old))) || particles[x - 1][y - 1].fresh == 'empty'))
                        changePoint(x - 1, y - 1, type);
                    else if (flow >= 2 && ((isLiquid(particles[x + 1][y - 1].fresh) && (getDensity(particles[x + 1][y - 1].fresh) < getDensity(particle.old))) || particles[x + 1][y - 1].fresh == 'empty'))
                        changePoint(x + 1, y - 1, type);
                    else
                        changePoint(x, y - 1, type);
                }
                else{
                    setTimeout(changePoint, gameSpeed, x, y - 1, particle.old);
                    /* var flow = Math.floor(Math.random()*4);
                    forcePoint(x, y, type);
                    if (flow <=1 && (isLiquid(particles[x - 1][y - 1].fresh) || particles[x - 1][y - 1].fresh == 'empty')) {
                        changePoint(x - 1, y - 1, particle.old);
                    }
                    else if (flow >= 2 && (isLiquid(particles[x + 1][y - 1].fresh) || particles[x + 1][y - 1].fresh == 'empty'))
                        changePoint(x + 1, y - 1, particle.old);
                    else
                        setTimeout(forcePoint, gameSpeed, x, y, type);
                    changePoint(x, y - 1, particle.old);*/
                    return false;
                }
                return true;
            }
            if (isSolid(particle.old) && isGas(type)) {
                changePoint(x, y, particle.old);

                var flow;
                if (particles[x - 1][y + 1].fresh == 'empty')
                    if (particles[x + 1][y + 1].fresh == 'empty')
                        flow = Math.floor(Math.random()*3)-1;
                    else
                        flow = Math.floor(Math.random()*2)-1;
                else
                    if (particles[x + 1][y + 1].fresh == 'empty')
                        flow = Math.floor(Math.random()*2);
                    else
                        flow = 0;
                setTimeout(changePoint, gameSpeed, x + flow, y + 1, type);
                return true;
            }
            if (isGas(particle.old) && isGas(type) && type != 'cloud') {
                var flow = Math.floor(Math.random()*4);
                if (flow <=1 && particles[x - 1][y + 1].fresh == 'empty')
                    changePoint(x - 1, y + 1, type);
                else if (flow >= 2 && particles[x + 1][y + 1].fresh == 'empty')
                    changePoint(x + 1, y + 1, type);
                return true;
            }
            if (isSolid(particle.old) && isSolid(type)) {
                forcePoint(x, y, particle.old);
                return true;
            }
            if (isGas(type) && isLiquid(particle.old)) {
                forcePoint(x, y, particle.old);
                setTimeout(changePoint, gameSpeed, x, y - 1, type);
                return true;
            }
            return false;
        } catch (e) { }
    }

    /* If force, it forces the change, unless the type is in the exceptions array */
    /* Same for not forcing */
    function circlePoint(x, y, r, type, force, exceptions) {
        elipsePoint(x, y, r, r, type, force, exceptions);
    }

    function elipsePoint(x, y, xr, yr, type, force, exceptions) {
        try {
            for (var i = 0;i<xr;i++) {
                for (var j = 0;j<yr;j++) {
                    var dist = Math.sqrt(Math.pow(i/xr, 2)+Math.pow(j/yr, 2));
                    if (dist<=1) {
                        if (force) {
                            if (exceptions.indexOf(type)!=-1) {
                                try { changePoint(x + i, y + j, type); } catch (e) { }
                                try { changePoint(x - i, y + j, type); } catch (e) { }
                                try { changePoint(x + i, y - j, type); } catch (e) { }
                                try { changePoint(x - i, y - j, type); } catch (e) { }
                            } else {
                                try { forcePoint(x + i, y + j, type); } catch (e) { }
                                try { forcePoint(x - i, y + j, type); } catch (e) { }
                                try { forcePoint(x + i, y - j, type); } catch (e) { }
                                try { forcePoint(x - i, y - j, type); } catch (e) { }
                            }
                        } else {
                            if (exceptions.indexOf(type)!=-1) {
                                try { forcePoint(x + i, y + j, type); } catch (e) { }
                                try { forcePoint(x - i, y + j, type); } catch (e) { }
                                try { forcePoint(x + i, y - j, type); } catch (e) { }
                                try { forcePoint(x - i, y - j, type); } catch (e) { }
                            } else {
                                try { changePoint(x + i, y + j, type); } catch (e) { }
                                try { changePoint(x - i, y + j, type); } catch (e) { }
                                try { changePoint(x + i, y - j, type); } catch (e) { }
                                try { changePoint(x - i, y - j, type); } catch (e) { }
                            }
                        }
                    }
                }
            }
        } catch(e) { }
    }

    function rectanglePoint(x, y, xr, yr, type, force, exceptions) {
        try {
            for (var i = 0;i<xr;i++) {
                for (var j = 0;j<yr;j++) {
                    if (force && exceptions.indexOf(type)==-1) {
                        try { forcePoint(x + i, y + j, type); } catch (e) { }
                    } else {
                        try { changePoint(x + i, y + j, type); } catch (e) { }
                    }
                }
            }
        } catch (e) { }
    }

    /* Out of 100 */
    function getDensity(type) {
        switch(type) {
            case 'liquidExplosive':
                return 25;
            case 'droplet':
                return 50;
            case 'sticky':
                return 80;
            case 'lava':
                return 85;
            case 'sand':
                return 90;
            case 'nut':
                return 95;
            case 'soil':
                return 95;
        }
        throw 'Non - fluids do not have densities';
    }

    /* Basically, is is solid or does it move */
    function isSolid(type) {
        return type=='wall' || type=='explosive' || type=='growth' || type=='ice' || type=='bark' || type=='shrub' || type=='cloak' || isGen(type);
    }

    function isLiquid(type) {
        return type=='droplet' || type=='liquidExplosive' || type=='sand' || type=='sticky' || type=='lava' || type=='soil' || type=='nut';
    }

    function isSticky(type) {
        return type=='sticky' || type=='sand';
    }

    function isClumpy(type) {
        return type=='sand' || type=='soil';
    }

    function isGas(type) {
        return type=='steam' || type=='smoke' || type=='fire' || type=='cloud';
    }

    function isCombustible(type) {
        return type=='explosive' || type=='liquidExplosive';
    }

    function isFlammable(type) {
        return type=='growth' || type=='bark' || type=='shrub' || type=='nut';
    }

    function isGen(type) {
        return type.substring(type.length - 3) == 'Gen';
    }
    function wasParticleGen(particle) {
        try {
            return particle.old.substring(particle.old.length - 3) == 'Gen';
        } catch (e) {    return false; }
    }
    function isParticleGen(particle) {
        try {
            return particle.fresh.substring(particle.fresh.length - 3) == 'Gen';
        } catch (e) {    return false; }
    }

    /**
     * A named list
     * @constructor
     */
    function List() {
        this.id = '';
        this.arr = [];
    }

    /* Compresses particles into lists of coordinates for each particle type then returns all of them combined */
    function compressParticles() {
        var p = '';
        var lists = [];
        for (var i = 0;i<particles.length;i++) {
            for (var j = 0;j<particles[0].length;j++) {
                var elem = compressElem(particles[i][j].fresh);
                if (particles[i][j].fresh != 'empty') {
                    var contains = -1;
                    for (var k = 0;k<lists.length;k++)
                        if (lists[k].id == elem) {
                            contains = k;
                            break;
                        }
                    if (contains==-1) {
                        lists.push(new List());
                        contains = lists.length - 1;
                        lists[contains].id = elem;
                    }
                    var m = i + '';
                    while (m.length<3) {
                        m = '0' + m;
                    }
                    var n = j + '';
                    while (n.length<3) {
                        n = '0' + n;
                    }
                    lists[contains].arr.push(m + '' + n);
                }
            }
        }
        for (var i = 0;i<lists.length;i++) {
            p += lists[i].id;
            for (var j = 0;j<lists[i].arr.length;j++) {
                p+=lists[i].arr[j];
            }
            p += ';';
        }
        return p;
    }

    function compressElem(elem) {
        switch(elem) {
            case 'sand':
                return 'a';
            case 'sandGen':
                return 'A';
            case 'bark':
                return 'b';
            case 'cloud':
                return 'c';
            case 'cloudGen':
                return 'C';
            case 'droplet':
                return 'd';
            case 'dropletGen':
                return 'D';
            case 'empty':
                return 'e';
            case 'fire':
                return 'f';
            case 'fireGen':
                return 'F';
            case 'growth':
                return 'g';
            case 'shrub':
                return 'h';
            case 'ice':
                return 'i';
            case 'lightning':
                return 'l';
            case 'lightningGen':
                return 'L';
            case 'cloak':
                return 'k';
            case 'smoke':
                return 'm';
            case 'smokeGen':
                return 'M';
            case 'nut':
                return 'n';
            case 'nutGen':
                return 'N';
            case 'soil':
                return 'o';
            case 'soilGen':
                return 'O';
            case 'plague':
                return 'p';
            case 'steam':
                return 's';
            case 'steamGen':
                return 'S';
            case 'sticky':
                return 't';
            case 'stickyGen':
                return 'T';
            case 'lava':
                return 'v';
            case 'lavaGen':
                return 'V';
            case 'wall':
                return 'w';
            case 'explosive':
                return 'x';
            case 'liquidExplosive':
                return 'z';
            case 'liquidExplosiveGen':
                return 'Z';
        }
    }

    function decompressElem(e) {
        switch(e) {
            case 'a':
                return 'sand';
            case 'A':
                return 'sandGen';
            case 'b':
                return 'bark';
            case 'c':
                return 'cloud';
            case 'C':
                return 'cloudGen';
            case 'd':
                return 'droplet';
            case 'D':
                return 'dropletGen';
            case 'e':
                return 'empty';
            case 'f':
                return 'fire';
            case 'F':
                return 'fireGen';
            case 'g':
                return 'growth';
            case 'h':
                return 'shrub';
            case 'i':
                return 'ice';
            case 'l':
                return 'lightning';
            case 'L':
                return 'lightningGen';
            case 'k':
                return 'cloak';
            case 'm':
                return 'smoke';
            case 'M':
                return 'smokeGen';
            case 'n':
                return 'nut';
            case 'N':
                return 'nutGen';
            case 'o':
                return 'soil';
            case 'O':
                return 'soilGen';
            case 'p':
                return 'plague';
            case 's':
                return 'steam';
            case 'S':
                return 'steamGen';
            case 't':
                return 'sticky';
            case 'T':
                return 'stickyGen';
            case 'v':
                return 'lava';
            case 'V':
                return 'lavaGen';
            case 'w':
                return 'wall';
            case 'x':
                return 'explosive';
            case 'z':
                return 'liquidExplosive';
            case 'Z':
                return 'liquidExplosiveGen';
        }
    }

    function loadXMLDoc(queryString, func) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                func(xmlhttp.responseText);
            }
        };
        /* xmlhttp.open('GET','script.cgi?' + queryString, false);
        xmlhttp.send();*/
        xmlhttp.open('POST','script.cgi', false);
        xmlhttp.setRequestHeader('Content - type','text/plain');
        xmlhttp.send(queryString);
    }

    function act(action) {
        var res;
        var retry = 0;
        while (retry<5)
            try {
                loadXMLDoc(action, function(r) {
                    res = r;
                });
                retry = 5;
            } catch(e) {
                retry++;
                if (retry == 5)
                    alert(e);
            }
        return res;
    }
})();
