/*
var fitnessGoal = 10;
var populationSize = 50;
var mutationPercent = 33;

var refreshRate = 0; //times per second (0 will print every frame)
*/

function simulate(){
    
    var timer = new Stopwatch();
    
    var population = new Population();
    population.mutationRate = parseFloat(mutationPercent.value)/100;
    population.fitnessGoal = parseFloat(fitnessGoal.value);
    population.create(parseFloat(populationSize.value));
    
    var f = fpsMeter(fps, 1/parseFloat(refreshRate.value), function(){
        population.display();
        elapsed.innerHTML = timer.elapsed();
    });
    
    var A = new AsyncLoop();
    A.refresh = 1000;
    
    A.loop = function(){
        
        done = population.evolveGeneration();
        var x =  f(); //refresh method
        
        A.requestInterruptToUpdateDOM = x;
        
        return !done && running.checked;
    }
    
    A.onComplete = function(){
        //done
        population.display();
        timer.stop();
        elapsed.innerHTML = timer.elapsed();
        
        running.checked = false;
    }
    
    running.checked = true;
    timer.start();
    A.run();
    
}

var Gene = function(code) {
    this.code = [];
    this.fitness = 0;
    if(code) this.code = code;
};
Gene.prototype.random = function(length) {
    while (length--) {
        this.code.push(random(0,1).toFixed(4));
    }
};
Gene.prototype.mutate = function(chance) {
    if (Math.random() > chance) return;
    
    var index = Math.floor(Math.random() * this.code.length);
    this.code[index] = random(0,1).toFixed(4);
};

Gene.prototype.mate = function(gene) {
    var pivot = Math.round(this.code.length / 2) - 1;

    var child1 = this.code.slice(0, pivot).concat(gene.code.slice(pivot));
    var child2 = gene.code.slice(0, pivot).concat(this.code.slice(pivot));

    return [new Gene(child1), new Gene(child2)];
};

Gene.prototype.calcFitness = function(compareTo) {
    reset();
    for(var i=0; i<this.code.length; i++){
        addHouse(this.code[i]);
        if(failed){
            this.fitness = houses.length;
            return;
        }
    }  
};

var Population = function() {
    this.members = [];
    this.generationNumber = 0;
    
    this.mutationRate = 0.05;
    
    this.fitnessGoal;
    this.bestMember;
};

Population.prototype.create = function(populationSize){
    this.members = [];
    this.generationNumber = 0;
    
    this.bestMember = new Gene();
    
    while (populationSize--) {
        var gene = new Gene();
        gene.random(this.fitnessGoal+1);
        this.members.push(gene);
    }
};

Population.prototype.sort = function() {
    this.members.sort(function(a, b) {
        return b.fitness - a.fitness;
    });
};

Population.prototype.evolveGeneration = function() {
    
    for (var i = 0; i < this.members.length; i++) {
        this.members[i].calcFitness(this.fitnessGoal);
    }
    this.sort();
    
    //mate the the 2 best
    var children = this.members[0].mate(this.members[1]);
    //children[0].calcFitness(this.fitnessGoal);
    //children[1].calcFitness(this.fitnessGoal);
    
    this.members.splice(this.members.length - 2, 2, children[0], children[1]);
    
    for (var i=0; i<this.members.length; i++) {
        
        this.members[i].mutate(this.mutationRate);
        
        if(this.members[i].fitness>this.bestMember.fitness){ //Best entity
            this.bestMember.fitness = this.members[i].fitness;   //copy best Fitness
            this.bestMember.code = this.members[i].code.slice(); //copy best DNA
        }
        
        if (this.members[i].fitness == this.fitnessGoal) {
            this.sort();
            
            return true; //fitnessGoal reached
        }
    }
    
    this.generationNumber++;
    
    return false;
};

Population.prototype.display = function() {
    popSize.innerHTML = this.members.length;
    generations.innerHTML = this.generationNumber;
    
    var text="";
    for (var i = 0; i < this.members.length; i++) {
        text += "<li>"+ this.members[i].code.join(", ") +"\t("+this.members[i].fitness+")</li>";
    }
    population.innerHTML = text;
    
    best.innerHTML = this.bestMember.code.join(", ") +"\t("+this.bestMember.fitness+")";
};



//************* Other functions and constructors used ************

// Returns a random number between min and max
function random(min, max) {
  return Math.random() * (max - min) + min;
}

/** Constructor that create a Loop object to run blocking loops, but allow
 * it to be interrupted when requested to give a change to make DOM updates
 * @author Victor B - www.vitim.us
*/
function AsyncLoop(){
	this.loop; //called on every loop
	this.onUpdate; //called when the loop is interrupted
	this.onComplete; //called when the loop is finished
    
    this.requestInterruptToUpdateDOM = false;
}
AsyncLoop.prototype.run = function(){
	var self = this;
	function loop(){
		while(true){
			//do stuff
			if(!self.loop.call()){
				if(self.onComplete) self.onComplete();
				return;
			}
            if(self.requestInterruptToUpdateDOM) break; //break loop to let DOM update
		}
		if(self.onUpdate) self.onUpdate();
		setTimeout(loop, 0); //async resume loop;
	}
	loop();
}


/**
 * FPS Meter - Returns a function that is used to compute the framerate without the overhead of updating the DOM every frame.
 * @author Victor B - www.vitim.us
 * @param {element} elm DOM Element to write the framerate
 * @param {number} refresh Updates per second of the DOM
 * @param {function} callback Function called on every DOM update
 * @return {function} Returns a function that will be called inside the loop
 */
function fpsMeter(elm, refresh, callback){
    //var elm;             //element
    //var refresh;         //refresh every x seconds
    
    var compRate = 1;      //compute frame rate every x frames (calculated on the go)
    var frames = 0;        //number of frames since last timing
    var last = 0;          //start Timing 
    
    return function(){
        if(++frames > compRate){
            var now = Date.now();
            var diff = now - last;
            
            if(diff>0){
                var fps = (1000/(diff/frames))<<0;
                last = now;
                frames = 0;
                
                //exponential ramp the next update to match the current refresh rate
                compRate = ((compRate*0.5)+((fps*refresh)*0.5))<<0;
                
                elm.innerHTML = fps;
                
                if(callback) callback.call(fps);
                
                return true;
            }
            else{
                compRate*=2;                
            }
        }
    }
}


/** Stopwatch constructor to measure the elapsed time
 * @author Victor B - www.vitim.us
 */
function Stopwatch(){
    this.running = false;
    
    this.startTimestamp;
    this.endTimestamp;
}
Stopwatch.prototype.start = function(){
    this.running = true;
    return this.startTimestamp = this.endTimestamp = Date.now();
}
Stopwatch.prototype.stop = function(){
    this.running = false;
    this.endTimestamp = Date.now();
    return this.endTimestamp;
}
Stopwatch.prototype.elapsed = function(){
    if(this.running) this.endTimestamp = Date.now();
    return this.endTimestamp - this.startTimestamp;
}
