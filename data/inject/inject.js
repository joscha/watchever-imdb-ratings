(function() {
	"use strict";

	var isDebug = false;

	var container = $('.ratingBloc > .rating');
	var bluePrint = container.find('.rateStars').find('.vote:not(.enabled), .mb.mr:not(.hidden)').clone();
	bluePrint.find('li').removeClass('off on half');

	function addRatingRow(type, rating, of, text, url, details) {
		var clone = bluePrint.clone();

		var roundedPercentage = Math.round(rating / of * 10) / 10;

		var starContainer = clone.eq(0);
		starContainer.attr('title', rating + ' / ' + of);
		var stars = starContainer.find('li');
		stars.addClass(function(index) {
			var fullStarPercentage = (index + 1) / 5;
			if(fullStarPercentage <= roundedPercentage) {
				return 'on';
			}
			// weird rounding is needed because of JS float (try 0.8 - 0.1 :D)
			var halfStarPercentage = Math.round((fullStarPercentage - 1 / 10) * 10) / 10;
			if(halfStarPercentage <= roundedPercentage) {
				return 'on half';
			}

			return 'off';
		});


		var textNode = clone.eq(1);
		textNode.text(text);
		if(details) {
			textNode.attr('title', details);
		}
		var div = $('<div>', {
			class: ['rateStars', 'imdb-ratings-watchever', type].join(' ')
		});
		clone.appendTo(div);
		div.prependTo(container);

		// add a link to IMDb
		if(url) {
			var $a = $('<a>', {
				target: '_blank',
				href: url
			});
			textNode.wrap($a);
		}	
	}

	// shamelessly taken from http://stackoverflow.com/questions/4292320
	function htmlNumericEntityUnescape(string) {
		return string.replace(/&#([^\s]*);/g, function(match, match2) {return String.fromCharCode(Number(match2));});
	}

	var annotate = function(data) {
		
		if(data.imdbID) {
			addRatingRow('imdb', data.imdbRating, 10, 'IMDb', 'http://www.imdb.com/title/' + encodeURIComponent(data.imdbID));
		}
		if(data.tomatoMeter !== 'N/A') {
			var details = data.tomatoConsensus !== 'N/A' ? htmlNumericEntityUnescape(data.tomatoConsensus) : null; 
			addRatingRow('rotten', data.tomatoMeter, 100, 'Rotten Tomatoes', null, details);
		}
	};

	var fireQuery = function(query, cb) {
		if(isDebug) {
			console.debug('query', query);
		}		
		$.getJSON('http://www.omdbapi.com/', query, function(data) {
			if(isDebug) {
				console.debug('result', data);
			}
			if(data.Response === 'True') {
				cb(null, data);
			} else {
				cb(data.Error, null);			
			}
		});
	};

	var queries = {
		filme: [],
		serien: []
	};

	function getReleaseInfo() {
		var releaseInfo = $('.MovieInfoRelease').text().trim().split(/\s*\|\s*/);
		return {
			year: releaseInfo[0]
		};
	}

	function getMovieDescription() {
		return $('.MovieDescription [itemprop=name]').text();
	}

	queries.filme.push(function() {
		var title = $('.InfoDetails').eq(3).find('.links').text();

		return {
			t: 			title,
			y: 			getReleaseInfo().year,
			tomatoes: 	true
		};		
	});

	queries.filme.push(function() {
		return {
			t: 			getMovieDescription(),
			y: 			getReleaseInfo().year,
			tomatoes: 	true
		};			
	});

	queries.serien.push(function() {
		return {
			t: 			getMovieDescription(),
			tomatoes: 	true
		};
	});

	queries.serien.push(function() {		
		// title without " - Staffel X"
		return {
			t: 			getMovieDescription().split(/^(.*?) - Staffel \d+$/i, 2)[1],
			tomatoes: 	true
		};
	});

	queries.serien.push(function() {		
		// title until first hyphen
		return {
			t: 			getMovieDescription().split(/\s*-/, 1)[0],
			tomatoes: 	true
		};
	});


	function fallbackQuery(queryFns) {
		var curFn = queryFns.shift();
		if(typeof curFn === 'function') {
			fireQuery(curFn(), function(err, result) {
				if(err) {
					fallbackQuery(queryFns);
				} else {
					annotate(result);
				}
			});
		} else {
			console.error('Could not find any data');
		}
	}

	var type = window.location.pathname.split('/',2)[1];
	fallbackQuery(queries[type]);

})();