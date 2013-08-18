(function() {
	"use strict";

	var extensionId = chrome.i18n.getMessage("@@extension_id");

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
			class: ['rateStars', extensionId, type].join(' ')
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


	var releaseInfo = $('.MovieInfoRelease').text().trim().split(/\s*\|\s*/);
	var year = releaseInfo[0];
	var title = $('.InfoDetails').eq(3).find('.links').text();

	var query = {
		t: title,
		y: year,
		tomatoes: true
	};

	var annotate = function(data) {
		
		if(data.imdbID) {
			addRatingRow('imdb', data.imdbRating, 10, 'IMDb', 'http://www.imdb.com/title/' + encodeURIComponent(data.imdbID));
		}
		if(data.tomatoMeter !== 'N/A') {
			var details = data.tomatoConsensus !== 'N/A' ? data.tomatoConsensus : null; 
			addRatingRow('rotten', data.tomatoMeter, 100, 'Rotten Tomatoes', null, details);
		}
	};

	var fireQuery = function(query, cb) {
		$.getJSON('http://www.omdbapi.com/', query, function(data) {
			if(data.Response === 'True') {
				cb(null, data);
			} else {
				cb(data.Error, null);			
			}
		});
	};

	fireQuery(query, function(err, result) {
		if(err) {
			query.t = $('.MovieDescription [itemprop=name]').text();
			fireQuery(query, function(err, result) {
				if(!err) {
					annotate(result);
				} else {
					console.error(err);
				}
			});
		} else {
			annotate(result);
		}
	});
})();