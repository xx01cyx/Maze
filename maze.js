var ctxs, wid, hei, cols, rows, mazes, stacks = [];
var quadSteps=[{dx: 0, dy: -1}, {dx: 1, dy: 0}, {dx: 0, dy: 1}, {dx: -1, dy: 0}];
var octSteps=[{dx: -1, dy: -1}, {dx: 0, dy: -1}, {dx: 1, dy: -1}, {dx: 1, dy: 0}, {dx: 1, dy: 1}, {dx: 0, dy: 1}, {dx: -1, dy: 1}, {dx: -1, dy: 0}];
var start = [{x:-1, y:-1}, {x:-1, y:-1}], end = [{x:-1, y:-1}, {x:-1, y:-1}],grid = 8;
var padding = 16, s, density=0.5, count=2;
var t0, t1, t2;
var interval1 = 0;
var interval2 = 0;
var flagA = false, flagB= false, flagErr = false, flagRet = false, flagCreate = false;
var act = true, skip = false;

function PriorityQueue()
{
    var currSize = 0;
    var heap = new Array(9999);  // Min Heap

    this.enqueue = function (data) {
        currSize++;
        heap[currSize] = data;
        shiftUp(currSize);
    }

    function shiftUp (pos) {
        var tmp = heap[pos];
        while (pos > 1 && heap[Math.floor(pos/2)].FScore >= tmp.FScore) {
            heap[pos] = heap[Math.floor(pos/2)];
            pos = Math.floor(pos/2);
        }
        heap[pos] = tmp;
    }

    this.dequeue = function () {
        if (this.empty()) {
            throw new Error("Empty queue!");
        }
        var res = heap[1];
        var tmp = heap[currSize];
        currSize--;
        
        var parent = 1;
        var child = 2;
        while (child <= currSize) {
            if (child < currSize && heap[child].FScore > heap[child+1].FScore)
                child++;

            if (tmp.FScore <= heap[child].FScore)
                break;

            heap[parent] = heap[child];
            parent = child;
            child *= 2;
        }

        heap[parent] = tmp;

        return res;
    }

    this.clear = function() {
        currSize = 0;
    }

    this.empty = function() {
        return (currSize == 0);
    }

}


var pq = new PriorityQueue();
var prev = new Array();
for (var i = 0; i < 999; i++) {
    prev[i] = new Array();
}


function ManhattanDistance(p1, p2) {
    return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
}

function EuclideanDistance(p1, p2) {
    return (p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y);
}

function drawMaze(index) {
    for( var i = 0; i < cols; i++ ) {
        for( var j = 0; j < rows; j++ ) {
            switch( mazes[index][i][j] ) {
                case 0: ctxs[index].fillStyle = "black"; break;
                case 1: ctxs[index].fillStyle = "gray"; break;
                case 2: ctxs[index].fillStyle = "red"; break;  // search route
                case 3: ctxs[index].fillStyle = "yellow"; break;  // success route
                case 4: ctxs[index].fillStyle = "#500000"; break;  // fail route
                case 8: ctxs[index].fillStyle = "blue"; break;  // end point
                case 9: ctxs[index].fillStyle = "gold"; break;  // start point
            }
            ctxs[index].fillRect( grid * i, grid * j, grid, grid  );
        }
    }
}

function drawBlock(ctx, sx, sy, a) {
    switch( a ) {
        case 0: ctx.fillStyle = "black"; break;
        case 1: ctx.fillStyle = "gray"; break;
        case 2: ctx.fillStyle = "red"; break;
        case 3: ctx.fillStyle = "yellow"; break;
        case 4: ctx.fillStyle = "#500000"; break;
        case 8: ctx.fillStyle = "blue"; break;
        case 9: ctxs[index].fillStyle = "gold"; break;
    }
    ctx.fillRect( grid * sx, grid * sy, grid, grid  );
}


function getNextStepForMaze1( index, sx, sy, a ) {
    var n = [];

    for (let i = 0; i < quadSteps.length; i++) {
        const step = quadSteps[i];
        
        if(sx + step.dx > 0 && sx + step.dx < cols - 1 && sy + step.dy > 0 && sy + step.dy < rows - 1 &&
            mazes[index][sx + step.dx][sy + step.dy] % 8 == a){
            n.push({x: sx + step.dx, y: sy + step.dy});

            break;
        }
    }
    return n;
}

function getOptimizedNextStepForMaze1(index, sx, sy, a) {

    var n = [];
    var min = cols > rows ? cols : rows;
    min =  2 * min * min;

    var pos = -1;

    for (let i = 0; i < quadSteps.length; i ++) {
        const step = quadSteps[i];

        if(sx + step.dx > -1 && sx + step.dx < cols && sy + step.dy > -1 && sy + step.dy < rows &&
            mazes[index][sx + step.dx][sy + step.dy] % 8 == a){

            distance = (end[index].x - sx - step.dx) * (end[index].x - sx - step.dx) + 
                        (end[index].y - sy - step.dy) * (end[index].y - sy - step.dy);
    
            if (distance < min) {
                pos = i;
                min = distance;
            }
        }
    }

    if (pos > -1) {
        n.push({x: sx + quadSteps[pos].dx, y: sy + quadSteps[pos].dy});
    }

    return n; 
}

function getNextStepForMaze2( index, sx, sy, a ) {
    var n = [];

    for (let i = 0; i < octSteps.length; i++) {
        const step = octSteps[i];
        
        if(sx + step.dx > 0 && sx + step.dx < cols - 1 && sy + step.dy > 0 && sy + step.dy < rows - 1 &&
            mazes[index][sx + step.dx][sy + step.dy] % 8 == a){
            n.push({x: sx + step.dx, y: sy + step.dy});

            break;
        }
    }
    return n;
}

function getOptimizedNextStepForMaze2(index, sx, sy, a) {

    var n = [];
    var dx = end[index].x - sx;
    var dy = end[index].y - sy;
    var min = cols > rows ? cols : rows;
    min = 2 * min * min;
    var pos = -1;

    for (let i = 0; i < octSteps.length; i ++) {
        const step = octSteps[i];

        if(sx + step.dx > -1 && sx + step.dx < cols && sy + step.dy > -1 && sy + step.dy < rows &&
            mazes[index][sx + step.dx][sy + step.dy] % 8 == a){

            distance = (end[index].x - sx - step.dx) * (end[index].x - sx - step.dx) + 
                        (end[index].y - sy - step.dy) * (end[index].y - sy - step.dy);
    
            if (distance < min) {
                pos = i;
                min = distance;
            }
        }
    }

    if (pos > -1) {
        n.push({x: sx + octSteps[pos].dx, y: sy + octSteps[pos].dy});
    }

    return n; 
}

function getFNeighbours1( index, sx, sy, a ) {
    var n = [];
    if( sx - 1 > 0 && mazes[index][sx - 1][sy] % 8 == a ) {
        n.push( { x:sx - 1, y:sy } );
    }
    if( sx + 1 < cols - 1 && mazes[index][sx + 1][sy] % 8 == a ) {
        n.push( { x:sx + 1, y:sy } );
    }
    if( sy - 1 > 0 && mazes[index][sx][sy - 1] % 8 == a ) {
        n.push( { x:sx, y:sy - 1 } );
    }
    if( sy + 1 < rows - 1 && mazes[index][sx][sy + 1] % 8 == a ) {
        n.push( { x:sx, y:sy + 1 } );
    }
    return n;
}

function getFNeighbours2( index, sx, sy, a ) {
    var n = [];
    if( sx - 1 >= 0 ) {
        if (mazes[index][sx - 1][sy] % 8 == a) {
            n.push( { x:sx - 1, y:sy } );
        }
        if (sy - 1 >= 0 && mazes[index][sx - 1][sy - 1] % 8 == a) {
            n.push( { x:sx - 1, y:sy - 1 } );
        }
        if (sy + 1 <= rows - 1 && mazes[index][sx - 1][sy + 1] % 8 == a) {
            n.push( { x:sx - 1, y:sy + 1 } );
        }
    }
    if( sx + 1 <= cols - 1) {
        if (mazes[index][sx + 1][sy] % 8 == a) {
            n.push( { x:sx + 1, y:sy } );
        }
        if (sy - 1 >= 0 && mazes[index][sx + 1][sy - 1] % 8 == a) {
            n.push( { x:sx + 1, y:sy - 1 } );
        }
        if (sy + 1 <= rows - 1 && mazes[index][sx + 1][sy + 1] % 8 == a) {
            n.push( { x:sx + 1, y:sy + 1 } );
        }
    }
    if( sy - 1 >= 0 && mazes[index][sx][sy - 1] % 8 == a ) {
        n.push( { x:sx, y:sy - 1 } );
    }
    if( sy + 1 <= rows - 1 && mazes[index][sx][sy + 1] % 8 == a ) {
        n.push( { x:sx, y:sy + 1 } );
    }
    return n;
}

function solveMaze1(index) {
    if( start[index].x == end[index].x && start[index].y == end[index].y ) {
        for( var i = 0; i < cols; i++ ) {
            for( var j = 0; j < rows; j++ ) {
                switch( mazes[index][i][j] ) {
                    case 2: mazes[index][i][j] = 3; break;
                }
            }
        }
        drawMaze(index);
        return;
    }

    var neighbours = getNextStepForMaze1( 0, start[index].x, start[index].y, 0 );
    if( neighbours.length ) {
        stacks[index].push( start[index] );
        start[index] = neighbours[0];
        mazes[index][start[index].x][start[index].y] = 2;
    } else {
        mazes[index][start[index].x][start[index].y] = 4;
        start[index] = stacks[index].pop();
    }

    drawMaze(index);
    requestAnimationFrame( function() {
        solveMaze1(index);
    } );
}

function solveMaze1Optimized(index) {

    if( start[index].x == end[index].x && start[index].y == end[index].y ) {
        for( var i = 0; i < cols; i++ ) {
            for( var j = 0; j < rows; j++ ) {
                switch( mazes[index][i][j] ) {
                    case 2: mazes[index][i][j] = 3; break;
                }
            }
        }
        drawMaze(index);
        if (!flagA) {
            t1 = window.performance.now();
            interval1 += (t1 - t0);
            document.getElementById("executionTime1").innerHTML += "Execution time: " + (interval1 / 1000) + "s";
            flagA = true;
        }
        if (flagA && flagB) {
            document.getElementById("btnClear").removeAttribute("disabled");
            document.getElementById("btnAct").setAttribute("disabled", "disabled");
            document.getElementById("btnCreateMaze").removeAttribute("disabled");
        }
        return;
    }

    var neighbours = getOptimizedNextStepForMaze1( index, start[index].x, start[index].y, 0 );
    if( neighbours.length ) {
        stacks[index].push( start[index] );
        start[index] = neighbours[0];
        if (mazes[index][start[index].x][start[index].y] != 8) {
            mazes[index][start[index].x][start[index].y] = 2;
        }
    } else {
        mazes[index][start[index].x][start[index].y] = 4;
        start[index] = stacks[index].pop();
    }
 
    drawMaze(index);
    

    if (act) {
        requestAnimationFrame( function() {
            solveMaze1Optimized(index);
        } );
    }
}

function solveMaze1AStar (index) {
    if( start[index].x == end[index].x && start[index].y == end[index].y ) {
        var p = prev[end[index].x][end[index].y];
        while(p) {
            if (mazes[index][p.x][p.y] == 2)
                mazes[index][p.x][p.y] = 3;
            p = prev[p.x][p.y];
        }
        for( var i = 0; i < cols; i++ ) {
            for( var j = 0; j < rows; j++ ) {
                switch( mazes[index][i][j] ) {
                    case 2: mazes[index][i][j] = 4; break;
                }
            }
        }
        drawMaze(index);
        if (!flagB) {
            t2 = window.performance.now();
            interval2 += (t2 - t0);
            document.getElementById("executionTime2").innerHTML += "Execution time: " + (interval2 / 1000) + "s";
            flagB = true;
        }
        if (flagA && flagB) {
            document.getElementById("btnClear").removeAttribute("disabled");
            document.getElementById("btnAct").setAttribute("disabled", "disabled");
            document.getElementById("btnCreateMaze").removeAttribute("disabled");
        }
        return;
    }
    var cur = pq.dequeue();
    while (mazes[index][cur.x][cur.y] == 2) {
        cur = pq.dequeue();
    }
    start[index] = {x: cur.x, y: cur.y};
    if (mazes[index][cur.x][cur.y] != 9 && mazes[index][cur.x][cur.y] != 8)
        mazes[index][cur.x][cur.y] = 2;
    var neighbours = getFNeighbours1(index, start[index].x, start[index].y, 0);
    if (neighbours.length) {
        for (var i = 0; i < neighbours.length; i++) {
            var t = {x: neighbours[i].x, y: neighbours[i].y,  FScore:  ManhattanDistance(neighbours[i], end[index])};
            pq.enqueue(t);
            prev[neighbours[i].x][neighbours[i].y] = { x: start[index].x, y: start[index].y };
        }
    } else {
        mazes[index][cur.x][cur.y] = 2;
    }

    drawMaze(index);
    
    if (act) {
        requestAnimationFrame( function() {
            solveMaze1AStar(index);
        } );
    }
}

function solveMaze2(index) {
    if( start[index].x == end[index].x && start[index].y == end[index].y ) {
        for( var i = 0; i < cols; i++ ) {
            for( var j = 0; j < rows; j++ ) {
                switch( mazes[index][i][j] ) {
                    case 2: mazes[index][i][j] = 3; break;
                }
            }
        }
        drawMaze(index);
        return;
    }
    var neighbours = getNextStepForMaze2( 0, start[index].x, start[index].y, 0 );
    if( neighbours.length ) {
        stacks[index].push( start[index] );
        start[index] = neighbours[0];
        mazes[index][start[index].x][start[index].y] = 2;
    } else {
        mazes[index][start[index].x][start[index].y] = 4;
        start[index] = stacks[index].pop();
    }
 
    drawMaze(index);
    requestAnimationFrame( function() {
        solveMaze2(index);
    } );
}

function solveMaze2Optimized(index) {
    const pms = new Promise (() => {
        if( start[index].x == end[index].x && start[index].y == end[index].y ) {
            for( var i = 0; i < cols; i++ ) {
                for( var j = 0; j < rows; j++ ) {
                    switch( mazes[index][i][j] ) {
                        case 2: mazes[index][i][j] = 3; break;
                    }
                }
            }
            drawMaze(index);
            t1 = window.performance.now();
            document.getElementById("executionTime1").innerHTML += "Execution time: " + ((t1 - t0) / 1000) + "s";
            flagA = true;
            if (flagA && flagB) {
                document.getElementById("btnClear").removeAttribute("disabled");
                document.getElementById("btnAct").setAttribute("disabled", "disabled");
                document.getElementById("btnCreateMaze").removeAttribute("disabled");
            }
            flagRet = true;
            return;
        }
    

        var neighbours = getOptimizedNextStepForMaze2( index, start[index].x, start[index].y, 0 );
        if( neighbours.length ) {
            stacks[index].push( start[index] );
            start[index] = neighbours[0];
            if (mazes[index][start[index].x][start[index].y] != 8) {
                mazes[index][start[index].x][start[index].y] = 2;
            }
        } else {
            mazes[index][start[index].x][start[index].y] = 4;
            start[index] = stacks[index].pop();
        }
    });
    pms.catch((e) => { flagErr = true; });

    if (flagErr || flagRet) {
        if (flagErr) 
            alert("Unsolvable maze!");
        document.getElementById("btnClear").removeAttribute("disabled");
        document.getElementById("btnCreateMaze").removeAttribute("disabled");
        return; 
    }
 
    drawMaze(index);

    if (act) {
        requestAnimationFrame( function() {
            solveMaze2Optimized(index);
        } );
    }
}

function solveMaze2AStar (index) {
    if( start[index].x == end[index].x && start[index].y == end[index].y ) {
        var p = prev[end[index].x][end[index].y];
        while(p) {
            if (mazes[index][p.x][p.y] == 2)
                mazes[index][p.x][p.y] = 3;
            p = prev[p.x][p.y];
        }
        for( var i = 0; i < cols; i++ ) {
            for( var j = 0; j < rows; j++ ) {
                switch( mazes[index][i][j] ) {
                    case 2: mazes[index][i][j] = 4; break;
                }
            }
        }
        drawMaze(index);
        t2 = window.performance.now();
        document.getElementById("executionTime2").innerHTML += "Execution time: " + ((t2 - t0) / 1000) + "s";
        flagB = true;
        if (flagA && flagB) {
            document.getElementById("btnClear").removeAttribute("disabled");
            document.getElementById("btnAct").setAttribute("disabled", "disabled");
            document.getElementById("btnCreateMaze").removeAttribute("disabled");
        }
        return;
    }

    const pms = new Promise(() => { 
        var cur = pq.dequeue();
        while (mazes[index][cur.x][cur.y] == 2) {
            cur = pq.dequeue();
        }
        start[index] = {x: cur.x, y: cur.y};
        if (mazes[index][cur.x][cur.y] != 9 && mazes[index][cur.x][cur.y] != 8)
            mazes[index][cur.x][cur.y] = 2;
        var neighbours = getFNeighbours2(index, start[index].x, start[index].y, 0);
        if (neighbours.length) {
            for (var i = 0; i < neighbours.length; i++) {
                var t = {x: neighbours[i].x, y: neighbours[i].y, FScore: ManhattanDistance(neighbours[i], end[index])};
                pq.enqueue(t);
                prev[neighbours[i].x][neighbours[i].y] = { x: start[index].x, y: start[index].y };
            }
        } else {
            mazes[index][cur.x][cur.y] = 2;
        }
    });
    pms.catch((e) => { flagErr = true; });

    if (flagErr) {
        document.getElementById("btnClear").removeAttribute("disabled");
        return; 
    }

    drawMaze(index);
    
    if (act) {
        requestAnimationFrame( function() {
            solveMaze2AStar(index);
        } );
    }
}


function getCursorPos( event ) {
    var rect = this.getBoundingClientRect();
    var x = Math.floor( ( event.clientX - rect.left ) / grid / s), 
        y = Math.floor( ( event.clientY - rect.top  ) / grid / s);
    
    if(end[0].x != -1) {
        onClear();
    }

    if( mazes[0][x][y] ) return;
    if( start[0].x == -1 ) {
        start[0] = { x: x, y: y };
        start[1] = { x: x, y: y };
        mazes[0][start[0].x][start[0].y] = 9;
        mazes[1][start[1].x][start[1].y] = 9;
        
        for(var i = 0; i < count; i++) {
            drawMaze(i); 
        }
    } else {
        end[0] = { x: x, y: y };
        end[1] = { x: x, y: y };
        mazes[0][end[0].x][end[0].y] = 8;
        mazes[1][end[1].x][end[1].y] = 8;

        document.getElementById("btnCreateMaze").setAttribute("disabled", "disabled");
        document.getElementById("btnClear").setAttribute("disabled", "disabled");
        document.getElementById("btnAct").removeAttribute("disabled");

        flagA = false;
        flagB = false;
        flagErr = false;
        flagRet = false;

        interval1 = 0;
        interval2 = 0;

        if(document.getElementById("sltType").value == "Maze1") {
            
            t0 = window.performance.now();

            solveMaze1Optimized(0);    
    
            pq.clear();
            pq.enqueue({x: start[1].x, y: start[1].y, FScore: ManhattanDistance(start[1], end[1])});
            prev = new Array();
            for (var i = 0; i < 999; i++) {
                prev[i] = new Array();
            }
            solveMaze1AStar(1);

        } else {

            t0 = window.performance.now();

            solveMaze2Optimized(0);

            pq.clear();
            pq.enqueue({x: start[1].x, y: start[1].y, FScore: ManhattanDistance(start[1], end[1])});
            prev = new Array();
            for (var i = 0; i < 999; i++) {
                prev[i] = new Array();
            }
            solveMaze2AStar(1);
        }
        
    }
}

function getNeighbours( index, sx, sy, a ) {
    var n = [];
    if( sx - 1 > 0 && mazes[index][sx - 1][sy] == a && sx - 2 > 0 && mazes[index][sx - 2][sy] == a ) {
        n.push( { x:sx - 1, y:sy } ); n.push( { x:sx - 2, y:sy } );
    }
    if( sx + 1 < cols - 1 && mazes[index][sx + 1][sy] == a && sx + 2 < cols - 1 && mazes[index][sx + 2][sy] == a ) {
        n.push( { x:sx + 1, y:sy } ); n.push( { x:sx + 2, y:sy } );
    }
    if( sy - 1 > 0 && mazes[index][sx][sy - 1] == a && sy - 2 > 0 && mazes[index][sx][sy - 2] == a ) {
        n.push( { x:sx, y:sy - 1 } ); n.push( { x:sx, y:sy - 2 } );
    }
    if( sy + 1 < rows - 1 && mazes[index][sx][sy + 1] == a && sy + 2 < rows - 1 && mazes[index][sx][sy + 2] == a ) {
        n.push( { x:sx, y:sy + 1 } ); n.push( { x:sx, y:sy + 2 } );
    }
    return n;
}

function createArray( c, r ) {
    var m = new Array( count );
    for( var i = 0; i < count; i++ ) {
        m[i] = new Array( c );
        for( var j = 0; j < c; j++ ) {
            m[i][j] = new Array(r);
            for(var k = 0; k < r; k++) {
                m[i][j][k] = 1;
            }
        }
    }
    return m;
}

function createMaze1() {
    var neighbours = getNeighbours( 0, start[0].x, start[0].y, 1 ), l;
    if( neighbours.length < 1 ) {
        if( stacks[0].length < 1 ) {
            flagCreate = true;

            for(var i = 0; i < count; i++) {
                drawMaze(i); 
            }

            stacks = new Array(count);
            stacks[0] = []
            stacks[1] = [];
            
            start[0].x = start[0].y = -1;
            document.getElementById( "canvas1" ).addEventListener( "mousedown", getCursorPos, false );
            document.getElementById( "canvas2" ).addEventListener( "mousedown", getCursorPos, false );
            document.getElementById("btnCreateMaze").removeAttribute("disabled");
            document.getElementById("btnClear").removeAttribute("disabled");
            document.getElementById("btnSkip").setAttribute("disabled", "disabled");
            document.getElementById("btnClear").setAttribute("disabled", "disabled");

            return;
        }
        start[0] = stacks[0].pop();
    } else {
        var i = 2 * Math.floor( Math.random() * ( neighbours.length / 2 ) )
        l = neighbours[i]; 
        mazes[0][l.x][l.y] = 0;
        mazes[1][l.x][l.y] = 0;

        l = neighbours[i + 1]; 
        mazes[0][l.x][l.y] = 0;
        mazes[1][l.x][l.y] = 0;

        start[0] = l

        stacks[0].push( start[0] )
    }

    if (!skip)
        for(var i = 0; i < count; i++) {
            drawMaze(i); 
        }
    
    requestAnimationFrame( createMaze1 );
}

function createMaze1NonAni(ctx) {

    while(true) {

        var neighbours = getNeighbours( 0, start[0].x, start[0].y, 1 ), l;
        if( neighbours.length < 1 ) {
            if( stacks[0].length < 1 ) {
                for(var i = 0; i < count; i++) {
                    drawMaze(i); 
                    drawMaze(i);    
                }
    
                for(var i = 0; i < count; i++) {
                    drawMaze(i); 
                    drawMaze(i);    
                }
    
                stacks = new Array(count);
                stacks[0] = []
                stacks[1] = [];
                
                start[0].x = start[0].y = -1;
                document.getElementById( "canvas1" ).addEventListener( "mousedown", getCursorPos, false );
                document.getElementById( "canvas2" ).addEventListener( "mousedown", getCursorPos, false );
                document.getElementById("btnCreateMaze").removeAttribute("disabled");
                document.getElementById("btnClear").removeAttribute("disabled");
                document.getElementById("btnSkip").setAttribute("disabled", "disabled");
                document.getElementById("btnClear").setAttribute("disabled", "disabled");

                return;
            }
            start[0] = stacks[0].pop();
        } else {
            var i = 2 * Math.floor( Math.random() * ( neighbours.length / 2 ) )
            l = neighbours[i]; 
            mazes[0][l.x][l.y] = 0;    
            mazes[1][l.x][l.y] = 0;

            l = neighbours[i + 1]; 
            mazes[0][l.x][l.y] = 0;
            mazes[1][l.x][l.y] = 0;
    
            start[0] = l
            stacks[0].push( start[0] )
        }    
    }
    document.getElementById("btnCreateMaze").removeAttribute("disabled");
    document.getElementById("btnClear").removeAttribute("disabled");
}

function createMaze2() {

    var r = Math.random();

    mazes[0][start[0].x][start[0].y] = r < density ? 0 : 1;
    mazes[1][start[1].x][start[1].y] = r < density ? 0 : 1;
    
    drawMaze(0);
    drawMaze(1);

    if(start[0].x == (cols - 1) && start[0].y == (rows - 1)){

        start[0].x = start[0].y = -1;
        document.getElementById( "canvas1" ).addEventListener( "mousedown", getCursorPos, false );
        document.getElementById( "canvas2" ).addEventListener( "mousedown", getCursorPos, false );
        document.getElementById("btnCreateMaze").removeAttribute("disabled");
        document.getElementById("btnClear").removeAttribute("disabled");
        document.getElementById("btnSkip").setAttribute("disabled", "disabled");
        document.getElementById("btnClear").setAttribute("disabled", "disabled");

        return;
    }

    for (var i = 0; i < count; i++) {
        start[i].x = start[i].x + 1;
        if(start[i].x == cols){
            start[i].x = 0;
            start[i].y = start[i].y + 1;
        }
    }

    requestAnimationFrame(createMaze2);
}

function createMaze2NonAni() {

    for(var i = 0; i < cols; i++){
        for(var j = 0; j < rows; j++){
            flag = Math.random();
            mazes[0][i][j] = flag < density ? 0 : 1;    
            mazes[1][i][j] = flag < density ? 0 : 1;    
        }
    }

    drawMaze(0);
    drawMaze(1);

    start[0].x = start[0].y = -1;

    document.getElementById( "canvas1" ).addEventListener( "mousedown", getCursorPos, false );
    document.getElementById( "canvas2" ).addEventListener( "mousedown", getCursorPos, false );
    document.getElementById("btnCreateMaze").removeAttribute("disabled");
    document.getElementById("btnClear").removeAttribute("disabled");
    document.getElementById("btnSkip").setAttribute("disabled", "disabled");
    document.getElementById("btnClear").setAttribute("disabled", "disabled");
}

function createCanvas(count) {

    ctxs = new Array(count);
    mazes = new Array(count);

    for(var i = 0; i < count; i++) {
        var canvas = document.createElement( "canvas" );
        wid = document.getElementById("maze" + (i + 1)).offsetWidth - padding; 
        hei = 400;
        
        canvas.width = wid; canvas.height = 400;
        canvas.id = "canvas" + (i + 1);
        ctxs[i] = canvas.getContext( "2d" );
        ctxs[i].fillStyle = "gray"; 
        var div = document.getElementById("maze" + (i + 1));
        div.appendChild( canvas );    
    }
    
    for(var i = 0; i < count; i++) {
        ctxs[i].fillRect( 0, 0, wid, hei );
    }
}

function init() {
    createCanvas(count);
}

function onCreate() {

    stacks = new Array(count);
    stacks[0] = []
    stacks[1] = [];

    // document.getElementById("text1").innerHTML = "DFS Algorithm";
    // document.getElementById("text2").innerHTML = "A* Algorithm";

    document.getElementById("btnCreateMaze").setAttribute("disabled", "disabled");
    document.getElementById("btnClear").setAttribute("disabled", "disabled");
    document.getElementById("btnAct").innerHTML = "Pause";
    document.getElementById("btnAct").setAttribute("disabled", "disabled");
    document.getElementById("btnSkip").removeAttribute("disabled");
    document.getElementById("executionTime1").innerHTML = "";
    document.getElementById("executionTime2").innerHTML = "";

    act = true;

    wid = document.getElementById("maze1").offsetWidth - padding; 
    hei = 400;

    cols = eval(document.getElementById("cols").value); 
    rows = eval(document.getElementById("rows").value);

    var mazeType = document.getElementById("sltType").value;

    if(mazeType == "Maze1") {
        cols = cols + 1 - cols % 2;
        rows = rows + 1 - rows % 2;    
    }

    mazes = createArray( cols, rows );

    for(var i = 0; i < count; i++) {

        var canvas = document.getElementById("canvas" + (i + 1));
        canvas.width = wid;
        canvas.height = hei;
        s = canvas.width / (grid * cols);
        canvas.height = s * grid * rows;
        ctxs[i].scale(s, s);
    }

    if(mazeType == "Maze1") {

        start[0].x = Math.floor( Math.random() * ( cols / 2 ) );
        start[0].y = Math.floor( Math.random() * ( rows / 2 ) );
        if( !( start[0].x & 1 ) ) start[0].x++; if( !( start[0].y & 1 ) ) start[0].y++;
        
        for(var i = 0; i < count; i++) {

            mazes[i][start[0].x][start[0].y] = 0;
        }

        
        if(document.getElementById("chkAnimated").checked) {

            createMaze1();
        }
        else {

            createMaze1NonAni();
        }
    }
    else {

        density = document.getElementById("density").value / 100;
        start[0].x = 0;
        start[0].x = 0;

        if(document.getElementById("chkAnimated").checked) {
            start[0] = { x: 0, y: 0 };
            start[1] = { x: 0, y: 0 };
            createMaze2();
        }
        else {

            createMaze2NonAni();
        }
    }
}

function setEmptyCanvas(count) {
    for (var i = 0; i < count; i++) {
        var div = document.getElementById("maze" + (i + 1));
        if (div.childNodes) 
            div.removeChild(div.childNodes[0]);
    }
    createCanvas(count);
}

function onSltType() {
    document.getElementById("executionTime1").innerHTML = "";
    document.getElementById("executionTime2").innerHTML = "";
    document.getElementById("btnClear").setAttribute("disabled", "disabled");

    if(document.getElementById("sltType").value == "Maze2") {
        document.getElementById("density").removeAttribute("disabled");
        
        setEmptyCanvas(count);
    }
    else {
        document.getElementById("density").setAttribute("disabled", "disabled");
        setEmptyCanvas(count);
    }
}

function onClear() {
    
    for(var i = 0; i < count; i++){
        for(var j = 0; j < cols; j++){
            for( var k = 0; k < rows; k++) {
                if (mazes[i][j][k] != 1) {
                    mazes[i][j][k] = 0;
                }    
            }
        }
    }

    for(var i = 0; i < count; i++) {
        drawMaze(i); 
    }
    for(var i = 0; i < count; i++) {
        drawMaze(i); 
    }

    stacks = new Array(count);
    stacks[0] = []
    stacks[1] = [];

    start[0].x = start[0].y = -1;
    start[1].x = start[1].y = -1;

    end[0].x = end[0].y = -1;
    end[0].x = end[0].y = -1;

    document.getElementById("btnAct").innerHTML = "Pause";
    document.getElementById("btnAct").setAttribute("disabled", "disabled");
    document.getElementById("btnClear").setAttribute("disabled", "disabled");
    document.getElementById("executionTime1").innerHTML = "";
    document.getElementById("executionTime2").innerHTML = "";

    act = true;

}

function changeStatus() {
    var s = document.getElementById("btnAct").innerHTML;
    if (s == "Pause") {

        t1 = window.performance.now();
        t2 = window.performance.now();
        interval1 += (t1 - t0);
        interval2 += (t2 - t0);

        document.getElementById("btnAct").innerHTML = "Continue";
        document.getElementById("btnCreateMaze").removeAttribute("disabled");
        document.getElementById("btnClear").removeAttribute("disabled");

        act = false;
        
    } else {
        t0 = window.performance.now();

        document.getElementById("btnAct").innerHTML = "Pause";
        document.getElementById("btnCreateMaze").setAttribute("disabled", "disabled");
        document.getElementById("btnClear").setAttribute("disabled", "disabled");

        act = true;

        if (document.getElementById("sltType").value == "Maze1") {
            solveMaze1Optimized(0);
            solveMaze1AStar(1);
        } else {
            solveMaze2Optimized(0);
            solveMaze2AStar(1);   
        }
    }
    
}

function onSkip() {
    if (document.getElementById("sltType").value == "Maze1") {
        createMaze1NonAni();
        document.getElementById("btnSkip").setAttribute("disable", "disable");
    } else {
        createMaze2NonAni();
        document.getElementById("btnSkip").setAttribute("disable", "disable");
    }
}