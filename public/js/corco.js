/* global angular,_,marked,hljs */
var corco = angular.module('corco', ['focusOn','ui.ace'] );

marked.setOptions({
	smartypants: true,
	breaks: true,
	highlight: function(code ) {
		hljs.highlightAuto(code).value;
	}
});

//corco.directive('startEdit', [function() {
	//return {
//
		//link: function( scope, element, attrs ) {
			//element.on('click', 
		//}
//
//}]);

/*
corco.directive('contenteditable', function() {

	return {
		require: 'ngModel',
		link: function(scope, elm, attrs, ctrl) {
			// view -> model
			elm.bind('blur', function() {
				scope.$apply(function() {
					ctrl.$setViewValue(elm.html());
				});
			});

			// model -> view
			ctrl.$render = function() {
				elm.html(ctrl.$viewValue);
			};

			// load init value from DOM
			ctrl.$setViewValue(elm.html());
		}
	};
});*/

/*
corco.directive('contenteditable', function() {
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, ctrl) {
      // view -> model
      element.bind('blur', function() {
        scope.$apply(function() {
			console.log(element.html());
			ctrl.$setViewValue(element.text());
        });
      });

      // model -> view
      ctrl.$render = function() {
        element.html(ctrl.$viewValue);
      };

      // load init value from DOM
      ctrl.$render();
    }
  };
});
*/

corco.controller('CorcoController', ['$scope','$http','$sce','focus', function( $scope, $http, $sce, focus ) {

	$scope.title = 'Corco project';
	$scope.editingFullRaw = '';
	$scope.raw = '';
	$scope.sectionList = [];
	$scope.editingRaw = '';
	$scope.editingHtml = '';

	$scope.editMode = false;
	$scope.fullEditMode = false;

	$scope.editingDirection = false;
	$scope.editingIdx = false;

	$scope.cancelFullEdit = function() {
		$scope.fullEditMode = '';
		$scope.fullEditMode = false;
	};
	$scope.saveFullEdit = function() {
		var raw = $scope.editingFullRaw;
		var sectionList = $scope.parseToSectionList( raw );
		$scope.makeHtmlByMarkdown( sectionList );
		$scope.sectionList = sectionList;
		$scope.fullEditMode = false;
		$scope.raw = raw;
	};
	$scope.editFullRaw = function() {
		$scope.editingFullRaw = $scope.raw;
		$scope.fullEditMode = true;
	};
	$scope.aceLoaded = function( _editor ) {

		//_editor.setWrapBehavioursEnabled( false );
		_editor.setOption("useWrapMode", true);
		_editor.session.setOption("indentedSoftWrap", false);
	};


	$scope.changeEditingRaw = function() {
		$scope.editingHtml = $sce.trustAsHtml( marked( $scope.editingRaw ) );
	};

	$scope.reverseToRaw = function( sectionList ) {

		var raw = '';
		_.each( sectionList, function( section, i ) {
			raw += 'corco_question\n';
			raw += section.leftText+'\n';
			raw += 'corco_answer\n';
			raw += section.rightText;
			
			if( i < sectionList.length-1 ) raw += '\n';
		});
		return raw;
	};


	$scope.saveEdit = function() {
		var modifiedRaw = $scope.editingRaw;
		
		$scope.sectionList[ $scope.editingIdx ][ $scope.editingDirection+'Text'] = modifiedRaw;
		$scope.sectionList[ $scope.editingIdx ][ $scope.editingDirection+'Html'] = $sce.trustAsHtml( marked( modifiedRaw ));

		var raw = $scope.reverseToRaw( $scope.sectionList );

		$scope.editingRaw = '';
		$scope.editMode = false;
	};

	$scope.cancelEdit = function() {
		$scope.editingRaw = '';
		$scope.editMode = false;
	};

	$scope.edit = function( $event, direction, idx ) {

		console.log( 'click edit');
		var raw = this.sectionList[ idx ][ direction+'Text' ];
		$scope.editingDirection = direction;
		$scope.editingIdx = idx;
		$scope.editingRaw = raw;
		$scope.editMode = true;
		$scope.editingHtml = $sce.trustAsHtml( marked( raw ) );

		focus('editArea');
		console.log( $event );
	};

	$scope.parseToSectionList = function( raw ) {

		var lineList = raw.split('\n');
		var sectionList = [];
		var leftText = '', rightText = '';

		var save = function() {
			console.log( leftText );
			sectionList.push({ leftText, rightText });
			leftText = '', rightText = '';
			return;
		};

		var leftMatcher = /^corco_question/;
		var rightMatcher = /^corco_answer/;

		var inLeft = false, inRight = false;

		console.log( lineList );
		_.each( lineList, function( line, i ) {

			if (inLeft) {

				if (line.match( leftMatcher )) {
					save();
				} else if (line.match( rightMatcher )) {
					inLeft = false, inRight = true;
				} else {
					leftText += line;
					if( typeof lineList[i+1] === 'string' && ! lineList[i+1].match( rightMatcher ) && ! lineList[i+1].match(leftMatcher) ) {
						leftText += '\n';
					}
				}

			} else if(inRight) {

				if (line.match( rightMatcher )) {
					save();
				} else if (line.match( leftMatcher )) {
					inLeft = true, inRight = false;
					save();
				} else {
					rightText += line;
					if( typeof lineList[i+1] === 'string' && ! lineList[i+1].match( rightMatcher ) && ! lineList[i+1].match(leftMatcher) ) {
						rightText += '\n';
					}
				}
			} else {

				if (line.match( leftMatcher )) {
					inLeft = true;
					if( leftText ) save();
				} else if (line.match( rightMatcher )) {
					inRight = true;
				} else {
					leftText += line;
					if( typeof lineList[i+1] === 'string' && ! lineList[i+1].match( rightMatcher ) && ! lineList[i+1].match(leftMatcher) ) {
						leftText += '\n';
					}
				}
			}
		});
		save();

		return sectionList;
	};

	$scope.makeHtmlByMarkdown = function( sectionList ) {

		_.each( sectionList, function( section ) {
			section.leftHtml = $sce.trustAsHtml( marked(section.leftText) );
			section.rightHtml = $sce.trustAsHtml( marked(section.rightText) );
		});
	};

	$scope.getCorco = function() {

		console.log('click getCorco');
		$http.get('corcoFile').then( function( res ) {

			console.log( res.data );
			this.raw = res.data.raw;

			var sectionList = this.parseToSectionList( res.data.raw );
			this.makeHtmlByMarkdown( sectionList );
			this.sectionList = sectionList;

		}.bind(this));
	};
	
	$scope.saveCorco = function() {

		var reqParams = { raw: this.raw };
		$http.post('corcoFile', reqParams ).then( function( res ) {

			console.log( res.data );

		}.bind(this));
	};

}]);

