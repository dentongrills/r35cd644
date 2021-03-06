(function (window, document, $) {
	var annunciatorHolder = {
			dnaLoaded: false, 
			slotExposed: false,
			slotSample: false,
			//Functions
			setSlotExposed: function (exp) {
				var annSlot = $("#annSlotExp");
				if(exp && !annunciatorHolder.slotExposed) {
					annSlot.addClass("a-yellow-on");
				} else if (annunciatorHolder.slotExposed) {
					annSlot.removeClass("a-yellow-on");
				}
				annunciatorHolder.slotExposed = exp;
			},
			setSlotSample: function (smp) {
				var annSlot = $("#annSlotSample");
				if(smp && !annunciatorHolder.slotSample) {
					annSlot.addClass("a-green-on");
				} else if (annunciatorHolder.slotSample) {
					annSlot.removeClass("a-green-on");
				}
				annunciatorHolder.slotSample = smp;
			},
			
			setLoadAnn: function (loaded) {
				
				setAnnunciator("#annDNALoad", loaded);
				setAnnunciator("#annDNANoLoad", !loaded);
				setAnnunciator("#annDNASplice", (loadedDna && loadedDna.isSplicing))
				annunciatorHolder.dnaLoaded = loaded;
			}
		};
		
		/* GENERAL VARS */
		var viewPage = "",
				loadedDna = null,
				exposedSlot = 0,
				src = "123456",
				remoteHandlers = {};
		var dummyData = {handleManipCallback:['{"success":true,"newSeq":"0001FFF000AAAA03000C000751878||189FFF|0B3|DEADBEEF0"}',
																		'{"success":true,"newSeq":"0001FFF0FFAA1A03000C000751878||189FFF|0B3|DEADBEEF0"}'],
									handleAnalysisTestCallback: ['{"valid":true, "stable":1, "trans":-1, "seqs":["124", "ABC", "DEF", "FED", "CBA"], "conf":[80, 60, 40, 20, 0], "pred":25.1234568, "buttons":"DEADBEEF0"}',
																				'{"valid":true, "stable":1, "trans":1, "seqs":["246", "ABC", "DEF"], "conf":[80, 60, 40], "pred":50, "buttons":"CAFEBABE1"}'],
									handleSplicePredCallback: ['{"pred":1}', '{"pred":2}', '{"pred":4}'],
									
									handleSpliceCompletionCallback: ['{"success":1, "newSeq":"0001000F00AAAA03000C000751878||189FFF|0B3|DEADBEEF0"}', '{"success":0, "newseq":""}']
																				
																		
																		};
	
	function initializeUI () {
		/*BIND MAIN MENU BUTTON LISTENER*/
		$("#mainMenu > .button").on("click", function() {
			if($(this).hasClass("button-disabled")) {return;}
			
			handleMainMenuClick(this.id);
		});
		/*BIND SLOT CONTROL BUTTON LISTENER*/
		$("#btnCloseSlot, #btnEjectSample").click( function(){handlePushButtonClick(this, handleExposeButtons);});
		
		/*BIND DNA ANALYSIS CONTROL LISTENERS*/
		$("#btnClrAnalysisCurr, #btnAnalysisLoad, #btnAnalysisDoTest").click(function() {handlePushButtonClick(this, handleGeneralAnalysisButtonClick);});
		
		$(".display-known").click(function () {handlePushButtonClick(this, displayKnown);});
		
		/*BIND MANIPULATOR CONTROL BUTTON LISTENER*/
		$("#manipHolder .button").on("click", function(){ handlePushButtonClick(this, handleManipulatorButton);});
		
		/*BIND SPLICING CONTROL BUTTON LISTENER*/
		$("#spliceButtons .button").click(function() {handlePushButtonClick(this, handleSpliceCommenceButtonClick);});
		$(".btn-seq-off").click(function() {handlePushButtonClick(this, handleSpliceTargetOffsetClick);});
		$("#spliceActions .button").click(function() {handlePushButtonClick(this, handleSpliceActionClick);});
		$("#btnSpliceFinish").click(function() {handlePushButtonClick(this, handleSpliceFinishClick);});
		
		
		/* INITIALIZATION STUFF*/
		setActivePage(6);
		createDnaSlots(3);
		createSplicingDnaSlots(3);
		updateAnalysisControlElements();
		updateSpliceCommenceButtons();
		updateMainMenuButtons();
		debug_createData();
		updateLoadedDependents();
		
		//debug_createDNAbuttons();
	}
	

	function setActivePage(page) {
		$(".dataPage").hide();
		var id = ""
		switch (page) {
			case 1: //Manipulate
				viewPage = "#dpManip";
				id="btnManip";
				break;
			case 2: //Load / Save DNA
				viewPage = "#dpLoadSave";
				 id="btnLoadSave";
				break;
			case 3: //DNA Tester
				viewPage = "#dpTester";
				 id="btnTester";
				break;
			case 4: //Splicing DNA selection
				viewPage = "#dpSplice1";
				id="btnSplice";
				break;
			case 5: //Splice in progress
				viewPage = "#dpSplice2";
				id="btnSplice";
				break;
			default: //Welcome
				viewPage = "#dpWelcome";
				id="btnRetMain";
		}
		$("#mainMenu > .button").removeClass("button-selected");
		$("#" + id).addClass("button-selected");
		$(viewPage).show();
	}
	
	//Worker functions
	
	/*
	MANIPULATION
	*/
	/* VARS */
	var mutationData = new mutationHolder(),
		manipBusy = false;
	/* WORKERS */
	
	function mutationHolder(mut=0, mts=0, adv=0, mal=0, sth=0) {
		this.mut = mut;
		this.mts = mts;
		this.adv = adv;
		this.mal = mal;
		this.sth = sth;
	}
	
	function doManipulation(task) {
		if(typeof(task) !== 'string') {
			return;
		}
		manipBusy = true;
		var taskList = task.split("=");
		if (taskList.length !== 2) {
			//Malformed task
			return;
		}
		updateManipReady();
		var out = {};
		out[taskList[0]] = taskList[1];
		xmit(out, "handleManipCallback");
	}
	
	/* HANDLERS */
	function handleManipulatorButton(clicked) {		
		doManipulation( $(clicked).attr("data-tsk"));
		
	}
	
	function handleManipCallback(data) {
		//'{"success":false,"newSeq":"0001000F00000003000C000751878||189|0B3|240|B3A"}']
		if (data != null) {
			manipBusy=false;
			var mutInfo = data.mutInfo; 
			setAnnunciator("#aMutAck", data.success);
			setAnnunciator("#aMutNack", !data.success);
			if (!data.success) {
				loadedDna = null;
			}
			if(data.success && data.newSeq) {
				loadedDna.seq = data.newSeq;
			} 
			updateLoadedDependents(false, true);
			updateManipReady();
		}
	}
	remoteHandlers.handleManipCallback = handleManipCallback;
	
	function parseDnaStringToManip(sDNA) {
		var dat = [], i, mutObj = new mutationHolder();
		if (typeof(sDNA) === 'string' && sDNA.length > 24) {
			for ( i = 4; i < 24; i+=4) {
				var s = sDNA.substr(i, 4);
				dat.push(hex2signedint(s));
			}
			
			i = 0;
			for (var k in mutObj) {
				mutObj[k] = dat[i++];
			}
		}
		return mutObj;
	}
	
	function hex2signedint(hex) {
		var a = parseInt(hex, 16),
				bytes = hex.replace('0x','').length,
				msb = 1 << ((bytes * 4) -1);
		if ((a & msb) > 0 ) {
			a -= (msb << 1) - 1
		}
		return a;
	}
	
	function safeSetMutationData(bExternal = false) {
		var dat;
		if(loadedDna) {
			dat = parseDnaStringToManip(loadedDna.seq);
		} else {
			dat = new mutationHolder();
		}
		updateManipList(bExternal, dat);
	}
	
	/* UPDATERS */
	function updateManipList(bExternal=false, newData=null) {
		//Clear update info on the manipulation list
		$("#manipHolder .text-field").removeClass("tf-c-red");
		
		var data = newData ? newData : mutationData;
		for(var k in data) {
			var t = $("#txt" + k.charAt(0).toUpperCase() + k.slice(1,3));
			if(t.hasClass("text-field")) {
				t.text(data[k]);
				if(bExternal && data[k] !== mutationData[k]) {
					safeAddClass(t, "tf-c-red");
				}
			}
			if(newData && mutationData.hasOwnProperty(k)) {
				mutationData[k] = data[k];
			}
		}
	}
	
	function updateManipReady() {
		var bReady = true;
		
		if(!loadedDna || loadedDna.isSplicing) {
			setAnnunciator("#aMutSample", true);
			bReady=false;
		} else {
			setAnnunciator("#aMutSample", false);
		}
		if(exposedSlot > 0) {
			setAnnunciator("#aMutOpen", true);
			bReady=false;
		} else {
			setAnnunciator("#aMutOpen", false);
		}
		manipBusy = manipBusy && bReady; //Can't be busy if it's not ready.
		setButtonEnabled("#manipHolder .button", bReady);
		bReady = bReady && !manipBusy;	//Can't be ready if it's busy
		setAnnunciator("#aMutRdy", bReady);
		setAnnunciator("#aMutIrr", manipBusy);
		
	}
	
	
	/*
	ANALYSIS
	*/
	
	/* VARS */
	var curSeq = [], prevSeq = [],
	iStable = 0, iTrans = 0;
	
	/* WORKERS */
	function seqEntry(seq, certainty) {
		this.seq = seq;
		if(certainty != null) {
			this.certainty = Math.min(100, Math.max(certainty, 0));
		} else {
			this.certainty = null;
		}
		this.getColour = function () {
			var hexComp = function(c) {
				c = Math.round(c).toString(16);
				return c.length === 1 ? '0' + c : c;
			},
			r = 255 * (100 - this.certainty) / 100;
			g = 255 * this.certainty / 100;
			return '#' + hexComp(r) + hexComp(g) + '00';			
		};
	}
	
	function displayKnown() {
		xmit({showknown:1});
	}
	
	function addSequence(seq) {
		if(curSeq.length >= 5) {
			return;
		}
		curSeq.push(new seqEntry(seq));
		updateAnalyzerSequence("#currAnalysis", curSeq);
		updateAnalysisControlElements();
	}
	
	function clearAnalysisBuffer(skipTransmit) {
		if(curSeq.length > 0) {
			curSeq = [];
			updateAnalyzerSequence("#currAnalysis", null);
			updateAnalysisControlElements();
			if(!skipTransmit) { xmit({analysisclear:1}); }
			
		}
	}
	
	function doAnalysisTest() {
		var s = "";
		for(var i = 0; i < curSeq.length; i++) {
			s += curSeq[i].seq;
		}
		var d = {};
		d.analysisdo = s;
		xmit(d, "handleAnalysisTestCallback");
	}
	
	function doAnalysisLoad() {
		if(!loadedDna) {return;}
		var buttons = [];
		var dnaSequence = loadedDna.seq;
		dnaSequence = dnaSequence.slice(dnaSequence.search(/[\w\d]{3}\|\|/));
		dnaSequence = dnaSequence.replace(/\|/g, "");
		
		for(var i = 0; i < dnaSequence.length; i+=3) {
			buttons.push(dnaSequence.slice(i, i+3));
		}
		loadedDna = null;
		xmit({analysisdestroy:1})
		updateAnalysisButtons(buttons);
		updateLoadedDependents();
	}
	
	/* HANDLERS */
	
	function handleAnalysisComponentClick(clicked) {
		if(curSeq.length >= 5) {
			return;
		}
		var seq = $(clicked).text();
		$(clicked).remove();
		addSequence(seq);
		
	}
	
	function handleGeneralAnalysisButtonClick(clicked) {
		var id = clicked.id;
		switch (id) {
			case "btnAnaDispKno":
				displayKnown();
				break;
			case "btnClrAnalysisCurr":
				clearAnalysisBuffer();
				break;
			case "btnAnalysisLoad":
				doAnalysisLoad();
				break;
				
			case "btnAnalysisDoTest":
				doAnalysisTest();
				break;
		}
	}
	
	function handleAnalysisTestCallback(data) {
		/*
		Expected response:
		{valid:true/false,
			stable:1,0,-1,
			trans,1,0,-1,
			seqs:["123", "456" ...]
			conf:[25, 100 ...],
			pred:25.24561
			buttons:"DEADBEEF0 ..."}
		*/
		setAnnunciator("#annErrNack", !data.valid);
		
		if(data.valid) {
			prevSeq = [];
			iStable = data.stable;
			iTrans = data.trans;
			var s = data.seqs, c = data.conf;
			
			if(s.length === c.length) {
				var minLen = Math.min(s.length, 5);
				for (var i = 0; i < minLen; i++) {
					prevSeq.push(new seqEntry(s[i], c[i]));
				}
			} else {
				for (var i = 0; i < s.length; i++) {
					prevSeq.push(new seqEntry(s[i]));
				}
			}
			if(iStable < 0) { clearAnalysisBuffer(true); }
			
			$(".txtPredEffect").text((Math.round(data.pred * 100) / 100.0) + ' %'); //lol fuck you js
			updateAnalyzerSequence("#prevAnalysis", prevSeq);
			updateAnalysisButtonsFromString(data.buttons);
			updateAnalysisControlElements();
			
		} else {
			clearAnalysisBuffer(true);
			xmit({analysisupdate:1}); //Should be handled via regular analysis screen update handler
		}
		
		//Process data, set annunciators. 
		/*
		Send entire current buffer to server. It will validate this. 
		If it's valid:
		Set annunciators stable / transient. Update previous analysis with data.
		If not stable clear current analysis.
		If invalid:
		Set NACK annunciator. 
		Clear current analysis buffer
		Update testing buffer
		Optional: gib user (f u href butte)
		
		*/
	}
	remoteHandlers.handleAnalysisTestCallback = handleAnalysisTestCallback;
	
	/* UPDATERS */
	function updateAnalyzerSequence(id, newList) {
		$(id + " .text-field").text("");
		if(newList) {
			for(var i = 0; i < newList.length; i++) {
				var s = newList[i],
				c = null,
				t = s.seq;
				
				if(s.certainty !== null) {
					c = s.getColour();
					t = "<span style='color:" + c +";'>" + t + "</span>"
				}
				$(id + i).html(t);
			}
		}
	}
	
	function updateAnalysisControlElements() {
		setAnnunciator("#annStableYes", iStable == 1);
		setAnnunciator("#annStableNo", iStable == -1);
		
		setAnnunciator("#annTransYes", iTrans == 1);
		setAnnunciator("#annTransNo", iTrans == -1);
		
		
		var invalid = !loadedDna || loadedDna.isSplicing;
		setAnnunciator("#annErrSample", invalid);
		setButtonEnabled("#btnAnalysisLoad", !invalid)
		
		invalid = curSeq.length >= 5;
		setAnnunciator("#annErrBuffer", invalid);
		setButtonEnabled("#analyzeComponents .button", !invalid);
		
		invalid = curSeq.length === 0;
		setAnnunciator("#annErrData", invalid);
		setButtonEnabled("#btnAnalysisDoTest", !invalid);
	}
	
	function updateAnalysisButtonsFromString(s) {
		var bList = [];
		
		for(var i = 0; i < s.length; i+=3) {
			bList.push(s.slice(i, i+3));
		}
		updateAnalysisButtons(bList);
	}
	
	function updateAnalysisButtons(buttonList) {
		var holder = $("#analyzeComponents");
		holder.empty();
		if(typeof(buttonList) === "object") {
			for(var i = 0; i < buttonList.length; i++) {
				$("<div>", {
					'class': 'button btn-tinyish',
					id: 'anaComp' + i
				}).appendTo(holder).text(buttonList[i]);
			}
			//Bind our listener
			$("#analyzeComponents .button").click( function() {handlePushButtonClick(this, handleAnalysisComponentClick);});
		}
	}
	
	/*
	DNA LOAD / SAVE
	*/
	
	/* VARS */
	var dnaSlots = [],
		dnaDetails = [];
		
	/* WORKERS */
	function doLoadDna(slot) {
		var index = slot-1, //0-based
		dna = dnaDetails[index],
		slotObj = dnaSlots[index];
		if(loadedDna === null && dna.seq)  {
			xmit({load:slot});
			loadedDna = dna;
			dnaDetails[index] = new dnaSlotInfo();
			updateLoadedDependents();
		}
	}
	
	function doSaveDna(slot) {
		var index = slot-1, //0-based
			dna = loadedDna,
			target = dnaDetails[index];
			
		if(loadedDna && !target.seq)  {
			xmit({save:slot});
			dnaDetails[index] = loadedDna;
			loadedDna = null;
			updateLoadedDependents();
			updateDnaSlot(slot);
		}
	}
	
	function doExchangeDna(slot) {
		var index = slot -1,
				lDna = loadedDna,
				tDna = dnaDetails[index];
				temp = lDna;
				if(lDna && tDna.seq) {
					xmit({exchange:slot});
					loadedDna = tDna;
					dnaDetails[index] = temp;
				}
				updateLoadedDependents(true);
				updateDnaSlot(slot);
	}
	
	function doClearDna(slot) {
		xmit({remove:slot});
		dnaDetails[slot-1] = new dnaSlotInfo();
		updateDnaSlot(slot);
	}
	
	function doExposeSlot(slot) {
		var oldSlot = exposedSlot;
		exposedSlot = slot;
		if (oldSlot > 0) {
			dnaDetails[oldSlot-1].exposed = 0;
			updateDnaSlot(oldSlot);
		}
		var output;
		if(slot > 0) {
			dnaDetails[slot-1].exposed = 1;
			updateDnaSlot(slot);
			output = {expose:slot};
		} else {
			output = {lock:1};
		}
		if(oldSlot != exposedSlot) {
			xmit(output);
		}
		updateExposedIndicator();
		updateManipReady();
		updateSpliceCommenceButtons();
	}
	
	function createDnaSlots(num) {
		dnaSlots = [];
		$("#dnaSlotHolder").empty();
		var finalObj = null;
		var tempObj = null;
		
		for (var i = 1; i <= num; i++) {
			//Main div
			finalObj = $("<div>", {
						id: "dnaSlot" + i,
						'class':'dna-slot',
						'data-id': i
					});
			//Container to hold values
			tempObj = $("<div></div>", {
									'class':'noborder'
									}).appendTo(finalObj);
			//Slot counter				
			$("<div>", {
				'class':"text-field tf-narrow"
			}).appendTo(tempObj).text(i.toString());
			//Annunciators
			$("<div>", {
				id: 'annDnaEmp' + i,
				'class':'annunciator a-red'
			}).appendTo(tempObj).text("EMPTY");
			$("<div>", {
				id: 'annDnaExp' + i,
				'class':'annunciator a-yellow'
			}).appendTo(tempObj).text("EXPOSED");
			$("<div>", {
				id: 'btnDnaLoad' + i,
				'class':'button btn-small',
			}).appendTo(tempObj).text("LOAD");
			$("<div>", {
				id: 'btnDnaSave' + i,
				'class':'button btn-small',
			}).appendTo(tempObj).text("SAVE");
			$("<div>", {
				id: 'btnDnaXchg' + i,
				'class':'button btn-small',
			}).appendTo(tempObj).text("XCHG");
			$("<div>", {
				id: 'btnDnaClear' + i,
				'class':'button btn-small',
			}).appendTo(tempObj).text("CLEAR");
			$("<div>", {
				id: 'btnDnaSlotExpose' + i,
				'class':'button btn-small',
			}).appendTo(tempObj).text("EXPOSE");
			//new tempObj for the next row
			tempObj = $("<div></div>", {
									'class':'noborder'
									}).appendTo(finalObj);
			$("<span>", {'class':'label'}).appendTo(tempObj).text("Seq:");
			$("<div>", {id: 'dnaSequence' + i, 'class':"text-field tf-long"}).appendTo(tempObj);
			
			//Append finalObj to the holder
			finalObj.appendTo("#dnaSlotHolder");
			dnaSlots.push(finalObj);
		}

		//Attach our event handler
		$(".dna-slot .button").on("click", function() {
			var number = $(this).closest('.dna-slot').attr('data-id');
			handleDNAClick(number, this.id, this);
		});
	}
	
	function dnaSlotInfo(seq=null, pathogenName=null, pathogenType=null, isSplicing=false) {
		this.seq = seq;
		this.pathogenName = pathogenName;
		this.pathogenType = pathogenType;
		this.isSplicing = isSplicing;
	}
	
	/* HANDLERS  */
	function handleDNAClick(slot, id, clicked) {
		if(!handlePushButtonClick(clicked)) {return;}
		
		var detClick = id.slice(0, id.length - slot.toString().length);
		switch(detClick) {
			case "btnDnaLoad":
				doLoadDna(slot);
				break;
			case "btnDnaSave":
				doSaveDna(slot);
				break;
			case "btnDnaXchg":
				doExchangeDna(slot);
				break;
			case "btnDnaClear":
				doClearDna(slot);
				break;
			
			case "btnDnaSlotExpose":
				doExposeSlot(slot);
				break;
		}
	}
	
	/* UPDATERS */
	
	function updateLoadedSection(cancGlobalUpdate) {
		if (loadedDna) {
			$("#txtPName").text(loadedDna.pathogenName);
			$("#txtPType").text(loadedDna.pathogenType);
			$("#txtPSeq").text(loadedDna.seq);
		} else {
			$("#txtPName").text("");
			$("#txtPType").text("");
			$("#txtPSeq").text("");
		}
		annunciatorHolder.setLoadAnn(loadedDna);
		if(!cancGlobalUpdate) {
			updateAllDnaSlots();
		}
	}
	
	function updateAllDnaSlots() {
		for(var i = 1; i <= dnaSlots.length; i++) {
			updateDnaSlot(i);
		}
	}
	
	function updateDnaSlot(slot) {
		var t = dnaSlots[slot-1],
				dna = dnaDetails[slot - 1];
		if (dna == null)
			dna = dnaDetails[slot - 1] = new dnaSlotInfo();
		if(dna.seq == null) {
			setAnnunciator("#annDnaEmp" + slot, true);
			$("#dnaSequence" + slot).text("");
			setButtonEnabled("#btnDnaClear" + slot, false);
		} else {
			setAnnunciator("#annDnaEmp" + slot, false);
			$("#dnaSequence" + slot).text(dna.seq);
			setButtonEnabled("#btnDnaClear" + slot, true);
		}
		
		if(loadedDna || dna.seq === null) {
			setButtonEnabled("#btnDnaLoad" + slot, false);
		} else {
			setButtonEnabled("#btnDnaLoad" + slot, true);
		}
		
		if(loadedDna && dna.seq === null && !loadedDna.isSplicing){
			setButtonEnabled("#btnDnaSave" + slot, true);
		} else {
			setButtonEnabled("#btnDnaSave" + slot, false);
		}
		
		if( loadedDna && dna.seq !== null && !loadedDna.isSplicing) {
			setButtonEnabled("#btnDnaXchg" + slot, true);
		} else {
			setButtonEnabled("#btnDnaXchg" + slot, false);
		}
		if( !(loadedDna && loadedDna.isSplicing) ) {
			if(slot == exposedSlot ) {
				setAnnunciator("#annDnaExp" + slot, true);
				setButtonEnabled("#btnDnaSlotExpose" + slot, false);
				updateExposedIndicator();
			} else {
				setAnnunciator("#annDnaExp" + slot, false);
				setButtonEnabled("#btnDnaSlotExpose" + slot, true);
			}
		} else {
			setButtonEnabled("#btnDnaSlotExpose" + slot, false);
		}
		updateSpliceSlot(slot); //Tied in with the load / save functionality
	}
	
	
	
	/*
	SPLICING
	*/
	
	/* VARS */
	var spliceSourceDna = null,
		selectedSpliceSource = 0;
	/* WORKERS */
	
	function createSplicingDnaSlots(num) {
		$("#spliceSlots").empty()
		for (var i = 1; i <= num; i++) {
			
			var finalObj = $("<div></div>", {
				id: "spliceSlot" + i,
				'class': 'dna-slot',
				'data-id': i
				}).appendTo("#spliceSlots");
			
			//ROW OF ANNUNCIATORS + BUTTONS
			
			var tempObj = $("<div></div>", {
				'class':'noborder'
			}).appendTo(finalObj);
			//Slot field
			$("<div></div>", {
				'class':'text-field tf-narrow'
				}).appendTo(tempObj).text(i);
			/*
			//Target annunciator
			$("<div></div>", {
				id:'annSpliceTarget' + i,
				'class':'annunciator a-green'
			}).appendTo(tempObj).text("TARGET");
			*/
			//Source annunciator
			$("<div></div>", {
				id:'annSpliceSource' + i,
				'class':'annunciator a-green'
			}).appendTo(tempObj).text("SOURCE");
			
			//Load button
			$("<div></div>", {
				id:'btnSpliceLoad' + i,
				'class':'button btn-small'
			}).appendTo(tempObj).text("LOAD");
			//Splice button
			$("<div></div>", {
				id:'btnSpliceSource' + i,
				'class':'button btn-small'
			}).appendTo(tempObj).text("SOURCE");
			
			//SEQUENCE LISTING
			tempObj = $("<div></div>", {
				'class':'noborder'
			}).appendTo(finalObj);
			$("<span></span>", {
				'class':'label'}).appendTo(tempObj).text("Seq:");
			$("<div></div>", {
				id:'txtSpliceSeq' +i,
				'class':'text-field tf-long'
				}).appendTo(tempObj);
		}
		//Bind listeners
		$("#spliceSlots .button").click(function() {handlePushButtonClick(this, handleSpliceSelectionClick);});
	}
	
	function setSpliceSource(slot) {
		var lastSlot = selectedSpliceSource;
		selectedSpliceSource = slot;
		if (lastSlot > 0) {
			updateSpliceSlot(lastSlot);
		}
		if (selectedSpliceSource > 0) {
			updateSpliceSlot(selectedSpliceSource);
		}
		xmit({splice:slot});
		updateSpliceCommenceButtons();
	}
	
	function beginSplice() {
		//Validate UI state
		var dna = dnaDetails[selectedSpliceSource-1];
		if(exposedSlot > 0 || dna.seq == null || !loadedDna) { return; }
		//Clear source DNA
		spliceSourceDna = dna;
		dnaDetails[selectedSpliceSource-1] = new dnaSlotInfo();
		//Set DNA status
		selectedSpliceSource=0;
		loadedDna.isSplicing = true;
		
		xmit({beginsplice:1});
		updateCompleteSpliceData(loadedDna.seq, true, spliceSourceDna.seq, true);
		updateLoadedDependents();
		setActivePage(5);
		updateMainMenuButtons();
	}
	
	function cancelSplice() {
		setSpliceSource(0);
	}
	
	
	function parseDna(jqTarget, dnaData, bRaw = false) {
		if(!typeof(dnaData) === 'string') {return;}
		
		var t = $(jqTarget);
		t.empty();
		var i = 0;
		if(bRaw) { //We got an entire DNA string. Skip the private component
			var i = dnaData.search(/\|\|/) - 3; //lol
			if(i < 0) { return; }
		}
		while (i < dnaData.length) {
			var s = "";
			if(dnaData[i] === '|') {
				s = '|';
				i += 1;
			} else if(i + 3 <= dnaData.length ) {
				s = dnaData.slice(i,i+3);
				i += 3;
			}
			$("<span>", {
			'class':'splice-ent'}).appendTo(t).text(s);
		}
		//Bind handler
		$(".splice-ent", t).click(function() {handleSpliceSequenceClick(this);});
		t.children().first().addClass("splice-selected");
		updateSpliceControls();
	}
	
	function shiftSelectedSpliceSeq(jqT, dir) {
		var t = $(jqT),
		curSel = $(".splice-selected", jqT);
		dir = dir/Math.abs(dir);
		if(dir < 0) {
			curSel = curSel.prev();
		} else {
			curSel = curSel.next();
		}
		if(curSel.length) {
			$(".splice-selected", jqT).removeClass("splice-selected");
			curSel.addClass("splice-selected");
		}
		updateSpliceControls();
	}
	
	function doSpliceAction(dir) {
		if(dir != 0) {dir= dir/Math.abs(dir);}
		var s = $("#txtSpliceSource .splice-selected"),
			t = $("#txtSpliceTarget .splice-selected"),
			iRel = 0, //Relative position to index
			iPos = 0, //Position from which the item is added / removed
			sVal = "."; //The value we add
			
			if(s.length===0 && dir != 0) { return; } //No sense in continuing without a target
			
			if(dir != 0) {
				//Shift source selection
				if(s.next().length > 0) {
					s.next().addClass("splice-selected").siblings().removeClass("splice-selected");
				} else if(s.prev().length > 0) {
					s.prev().addClass("splice-selected").siblings().removeClass("splice-selected");
				}
				t.removeClass("splice-selected");
			} else if(t.length) {
				//Shift target selection
				if(t.next().length > 0) {
					t.next().addClass("splice-selected");
				} else if(t.prev().length > 0) {
					t.prev().addClass("splice-selected");
				}
			}
			iPos = t.index();
			//Perform the operation
			if(t.length===0 && dir != 0) {
				s.appendTo("#txtSpliceTarget");
				s.addClass("splice-selected");
			} else if ( dir > 0 ) {
				s.insertAfter(t);
				iRel = 1;
				s.addClass("splice-selected");
			} else if ( dir < 0 ) {
				s.insertBefore(t);
				iRel = -1;
				s.addClass("splice-selected");
			} else {
				t.remove();
			}
			if(iRel != 0) {sVal = s.text();}
			updateSpliceControls();
			xmit({splicemod:1, data:sVal,pos:iPos,rel:iRel}, "handleSplicePredCallback");
	}
	
	function finishSplice() {
		xmit({splicefinish:1}, "handleSpliceCompletionCallback")
	}
	
	/* HANDLERS */
	function handleSpliceSelectionClick(clicked) {
		var slot = $(clicked).closest(".dna-slot").attr("data-id");
		if (slot == null) return;
		var id = clicked.id.slice(0, clicked.id.length - slot.toString().length);
		switch(id)  {
			case "btnSpliceLoad":
				if (loadedDna) {
					doExchangeDna(slot);
				} else {
					doLoadDna(slot);
				}
				break;
			case "btnSpliceSource":
				setSpliceSource(slot);
				break;
		}
	}
	
	function handleSpliceCommenceButtonClick(clicked) {
		switch (clicked.id) {
			case "btnSpliceBegin":
				beginSplice();
				break;
			case "btnSpliceCancel":
				cancelSplice();
				break;
		}
	}
	
	function handleSpliceSequenceClick(clicked) {
		var tf = $(clicked).closest(".text-field");
		$(".splice-ent", tf).removeClass("splice-selected");
		$(clicked).addClass("splice-selected");
		updateSpliceControls();
	}
	
	function handleSpliceTargetOffsetClick(clicked) {
		var t = $(clicked).closest(".splice-sequence"),
		d = $(clicked).attr("dir");
		shiftSelectedSpliceSeq(t, d);
	}
	
	function handleSpliceActionClick(clicked) {
		var d = $(clicked).attr("dir");
		doSpliceAction(d);
	}
	
	function handleSpliceFinishClick(clicked) {
		finishSplice();
	}
	
	
	function handleSplicePredCallback(data) {
		/*Expects
		{pred:0,1,2,4 //Bitflags for SUCCESS, UNKNOWN and FAIL
		}
		*/
		setAnnunciator("#annPredSuccess", data.pred & 1);
		setAnnunciator("#annPredUnk", data.pred & 2);
		setAnnunciator("#annPredFail", data.pred & 4);
	}
	remoteHandlers.handleSplicePredCallback = handleSplicePredCallback;
	
	function handleSpliceCompletionCallback(data) {
		/*Expects 
		{success:0,1 //If the splicing succeeded or not.
		newseq:"00011512452..." //The newly created DNA sequence
		}
		*/
		setAnnunciator("#annSpliceSuccess", data.success);
		setAnnunciator("#annSpliceFail", !data.success);
		
		if(data.success) {
			loadedDna.seq = data.newSeq;
			loadedDna.isSplicing=false;
		} else {
			loadedDna = null;
		}
		spliceSourceDna = null;
		updateSpliceControls();
		updateLoadedDependents();
		updateMainMenuButtons();
		
	}
	remoteHandlers.handleSpliceCompletionCallback = handleSpliceCompletionCallback;
	/* UPDATERS */
	function updateSpliceSlot(slot) {
		var dna = dnaDetails[slot -1];
		if (dna == null) {
			dna = dnaDetails[slot - 1] = new dnaSlotInfo();
		}
		//Annunciators
		
		if (dna.seq == null) {
			$("#txtSpliceSeq" + slot).text("");
			if(selectedSpliceSource == slot) {
				selectedSpliceSource=0;
			}
		} else {
			$("#txtSpliceSeq" + slot).text(dna.seq);
		}
		setAnnunciator("#annSpliceSource" + slot, slot == selectedSpliceSource);
		
		//BUTTONS
		setButtonEnabled("#btnSpliceLoad" + slot, dna.seq != null);
		setButtonEnabled("#btnSpliceSource" + slot, slot !== selectedSpliceSource && dna.seq != null);
		
	}
	
	function updateSpliceCommenceButtons() {
		var a = exposedSlot > 0,
				b = selectedSpliceSource > 0 && dnaDetails[selectedSpliceSource-1].seq != null,
				c = loadedDna != null;
				
		setAnnunciator("#annSpliceStatExp", a);
		setAnnunciator("#annSpliceStatSource", b);
		setAnnunciator("#annSpliceStatTarget", c);
		
		setButtonEnabled("#btnSpliceBegin", !a && b && c);
	}
	
	function updateSpliceControls() {
		var bValidSplice = loadedDna != null && loadedDna.isSplicing;
		//FINISH
		setButtonEnabled("#btnSpliceFinish", bValidSplice);
		//TARGET
		setButtonEnabled("#spliceTargetField .button", bValidSplice && $("#txtSpliceTarget span").length > 1);
		setAnnunciator("#annSpliceTargetEmpty",  $("#txtSpliceTarget span").length <= 0);
		
		//SOURCE
		setButtonEnabled("#spliceSourceField .button",  bValidSplice && $("#txtSpliceSource span").length > 1);
		setAnnunciator("#annSpliceSourceEmpty",  $("#txtSpliceSource span").length <= 0);
		
		//BUTTONS
		setButtonEnabled("#spliceActions .button[dir!='0']",  bValidSplice && $("#txtSpliceSource .splice-selected").length > 0);
		setButtonEnabled("#spliceActions .button[dir='0']",  bValidSplice && $("#txtSpliceTarget .splice-selected").length > 0);
		
	}
	
	function updateCompleteSpliceData(target, btRaw, source, bsRaw) {
		//Update Splicing Source menu items
		parseDna("#txtSpliceTarget", target, btRaw);
		parseDna("#txtSpliceSource", source, bsRaw);
		setAnnunciator("#spliceFinalButtons > .annunciator", false);
		setAnnunciator("#annPredSuccess", true);
	}
	
	/*
	GENERAL
	*/
	
	/* UI STATE UPDATER */
	function setUIState(data) {
		if(data.hasOwnProperty("src")) {
			//Used to construct the href
			src = data.src;
		}
		//Which page was used last
		if(data.hasOwnProperty("actPage")) {
			setActivePage(data.actPage);
		}
		//Which DNA sequence is currently loaded
		if(data.hasOwnProperty("loadedDna")) {
			loadedDna = data.loadedDna;
			updateLoadedDependents(cancGlobalUpdate=true);
		}
		//The DNA slots themselves
		if(data.hasOwnProperty("dnaDetails") && typeof(data.dnaDetails) === 'object') {
			for(var i = 0; i < data.dnaDetails.length; i++) {
				var d = data.dnaDetails[i];
				if (!d) { d = new dnaSlotInfo();}
				dnaDetails[i] = d;
				updateDnaSlot(i+1);
			}
		}
		
		//If a slot is exposed
		if(data.hasOwnProperty("exposed")) {
			doExposeSlot(data.exposed);
		}
		
		//Splicing
		if(data.hasOwnProperty("splice")) {
			var s = data.splice;
			//{"source":'dna string', "sRaw":0, "target":'dna-string', "tRaw":1, "selected":0, "pred":(0,1,2,4)}
			var source = null;
			if(s.source) {
				source = s.source;
			}
			var target = null;
			if(s.target) {
				target = s.target;
			}
			
			updateCompleteSpliceData(target, data.tRaw, source, data.sRaw);
			updateSpliceControls();
			
			if(s.hasOwnProperty("selected")) {
				setSpliceSource(s.selected);
			}
		}
		
		if (data.hasOwnProperty("analysis")) {
			var a = data.analysis;
			// { "curr":[1, 2 .. 5], "prev":{analysisCallback(see below)}, "buttons":'ABCDEF'}
			if(a.curr) {
				for(var i = 0; i < a.curr.length && i < 5; i++) {
					addSequence(a.curr[i]);
				}
			}
			if(a.prev) {
				/*
				{valid:true/false,
					stable:1,0,-1,
					trans,1,0,-1,
					seqs:["123", "456" ...]
					conf:[25, 100 ...],
					pred:25.24561
					buttons:"DEADBEEF0 ..."}
				*/
				handleAnalysisTestCallback(a.prev);
				
			}
			updateAnalysisControlElements();
		}
		
	}
	
	/* DATA TRANSMISSION */
	function xmit(data, callbackHandler) {
		if(!typeof(data) == 'object' ) {
			return;
		}
		if(callbackHandler) {
			data.callbackHandler = callbackHandler;
			setTimeout(function () {receiveData(callbackHandler, debug_getCallbackDummyData(callbackHandler)) }, Math.random() * 4000);
			setAnnunciator("#annSynch", true);
		}
		var params = [];
		for(var k in data) {
			params.push(encodeURI(k) + "=" + encodeURI(data[k]));
		}
		
		var target = "?src=" + src + ";" + params.join(";");
		console.log(target);
		//window.location = target;
	}
	
	/* DATA RECEIPT */
	
	function receiveData(handler, data) { 
		setAnnunciator("#annSynch", false);
		if(remoteHandlers[handler]) {
				data = JSON.parse(data);
				remoteHandlers[handler](data);
			}
	}
	
	/*WORKERS*/
	function doEjectSample() {
		if(exposedSlot > 0) {
			xmit({eject:1});
			dnaDetails[exposedSlot-1] = new dnaSlotInfo();
			updateDnaSlot(exposedSlot);
			updateExposedIndicator();
		}
	}
	
	function updateLoadedDependents(cancGlobalUpdate = false, externalManip = false) {
		updateLoadedSection(cancGlobalUpdate);
		safeSetMutationData(externalManip);
		updateManipReady();
		updateAnalysisControlElements();
		updateSpliceCommenceButtons();
		updateMainMenuButtons();
	}
	
	/* HANDLERS */
	function handleMainMenuClick(id) {
		if($("#" + id).hasClass("button-disabled")) {return;}
		
		if(!spliceSourceDna) {	//Not splicing, everything's fine + dandy with the world.
		/*
			$("#mainMenu > .button").removeClass("button-selected");
			$("#" + id).addClass("button-selected");
			*/
			switch(id) {
				case "btnManip":
					updateManipList();
					setActivePage(1);
					break;
				case "btnSplice":
					setActivePage(4);
					break;
				case "btnTester":
					setActivePage(3);
					break;
				case "btnLoadSave":
					setActivePage(2);
					break;
				case "btnRetMain":
					setActivePage(6);
			}
		} 
	}
	
	function handleExposeButtons(clicked) {
		switch (clicked.id) {
			case "btnCloseSlot":
				doExposeSlot(0);
				break;
			case "btnEjectSample":
				doEjectSample();
				break;
		}
	}
	
	function handlePushButtonClick(clicked, handler) {
		if($(clicked).hasClass("button-disabled")) {return 0;}
		$(clicked).addClass("button-selected");
		setTimeout(function() {$(clicked).removeClass("button-selected");}, 50);
		if(handler) {
			handler(clicked);
		}
		return 1;
		
	}
	
	/* UPDATERS */
	
	function updateExposedIndicator() {
		var expDna = dnaDetails[exposedSlot -1];
		if(exposedSlot > 0) {
			setAnnunciator("#annSlotExp", true);
			setButtonEnabled("#btnCloseSlot", true);
			$("#txtExpSlot").text(exposedSlot.toString());
			
		} else {
			setAnnunciator("#annSlotExp", false);
			setButtonEnabled("#btnCloseSlot", false);
			$("#txtExpSlot").text("0");
		}
		
		if(!expDna || expDna.seq === null) {
			setAnnunciator("#annSlotSample", false);
			setButtonEnabled("#btnEjectSample", false);
		} else {
			setAnnunciator("#annSlotSample", true);
			setButtonEnabled("#btnEjectSample", true);
		}
	}
	
	function updateMainMenuButtons() {
		if (!loadedDna || !loadedDna.isSplicing) {
			setButtonEnabled("#mainMenu > .button", true);
		}	else {
			setButtonEnabled("#mainMenu > .button", false);
			setActivePage(5);
			$("#mainMenu > .button").removeClass("button-selected");
			setButtonEnabled("#btnSplice", true)
			$("#btnSplice").addClass("button-selected");
		}
	}
	
	/*
	HELPERS
	*/
	function safeAddClass(ident, className) {
		if(!$(ident).hasClass(className)) {
			$(ident).addClass(className);
		}
	}
	
	
	/* CONTROL SETTERS */
	function setAnnunciator(jqSel, bActive) {
		//Sets the state of an annunciator in a sane fashion
		var ann = $(jqSel);
		if(!ann.hasClass("annunciator")) {
			return 1;
		}
		var color = "red";
		if(ann.hasClass("a-green")) {
			color = "green";
		} else if (ann.hasClass("a-yellow")) {
			color = "yellow";
		}
		
		if(bActive) {
			safeAddClass(ann, "a-" + color + "-on");
		} else {
			ann.removeClass("a-" + color + "-on");
		}
		return 0;
	}
	
	function setButtonEnabled(jqSel, bEnable) {
		var btn = $(jqSel);
		if(!btn.hasClass("button")) {
			return 1;
		}
		if(bEnable) {
			btn.removeClass("button-disabled");
		} else {
			safeAddClass(btn, "button-disabled");
			
		}
	};
	
	/*
	DEBUG
	*/
	function debug_createData() {
		
		var dataObject = {src:'AB12CD', actPage:3, exposed:2, 
			loadedDna:{seq:"00020006FFFDFFF60000FFF53142E||FCB055|6A86A8|0F4CC6CC6", pathogenName:"TEST", pathogenType:"gmcell", isSplicing:1}, 
			dnaDetails:[ 
				{seq:"00020006000500000000FFFB3142E||055", pathogenName:"ABC2", pathogenType:"bacteria", isSplicing:0}, 
				null, 
				{seq:"00040003FFED0005FFF3FFEF51B8E||FCB", pathogenName:"ABC3", pathogenType:"parasite", isSplicing:0} 
				], 
			splice: { 
				source:"123|ABC||321|CBAFED",
				sRaw:0,
				target:"ABC345DEF|ADE||DDA|DDF",
				tRaw:0,
				selected:0,
			},
			analysis: {
				curr:["ABC", "DEF", "123", "456"],
				prev:{
					valid:1,
					trans:1,
					stable:-1,
					seqs:["ABC", "DEF", "123", "456"],
					conf:[100, 75, 34, 15],
					pred:25,
					buttons:"FFFEEEDDDCCCAAA999888777666555444333222111000"
				}
				
			}
		};
		setUIState(dataObject);
		//new (seq, pathogenName, pathogenType, exposed, isSplicing)
		/*
		dnaDetails.push(new dnaSlotInfo("00020006FFFDFFF60000FFF53142E||FCB055|6A86A8|0F4CC6CC6", "ABC1", "virus", false));
		dnaDetails.push(new dnaSlotInfo("00020006000500000000FFFB3142E||055", "ABC2", "bacteria", false));
		dnaDetails.push(new dnaSlotInfo("00040003FFED0005FFF3FFEF51B8E||FCB", "ABC3", "parasite", false));
		updateLoadedSection();
		for(var i = 1; i <= 3; i++){
			updateDnaSlot(i);
		}
		doExposeSlot(0);
		*/
	}
	
	function debug_createDNAbuttons() {
		var L = []
		for(var i = 0; i < 50; i++) {
			var s = Math.round(4096 * Math.random());
			s = '00' + s.toString(16);
			s = s.slice(s.length - 3);
			L.push(s.toUpperCase());
		}
		updateAnalysisButtons(L);
	}
	
	function debug_getCallbackDummyData( callbackHandler ) {
		var d = dummyData[callbackHandler];
		var r = null;
		if(typeof(d) === 'object') {
			var maxLen = d.length -1;
			r = d[Math.round(maxLen * Math.random())];
		}
		return r;
	}
	
	window.receiveData = receiveData;
	
	$(document).ready(initializeUI);
})(window, document, jQuery);