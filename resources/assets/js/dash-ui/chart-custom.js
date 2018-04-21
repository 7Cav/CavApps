//
// Charts
//
// Setup your custom charts based on chart.js plugin
// Read More: http://www.chartjs.org/docs/latest/
//



// draws a rectangle with a rounded top
Chart.helpers.drawRoundedTopRectangle = function(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  // top right corner
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  // bottom right   corner
  ctx.lineTo(x + width, y + height);
  // bottom left corner
  ctx.lineTo(x, y + height);
  // top left   
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

Chart.elements.RoundedTopRectangle = Chart.elements.Rectangle.extend({
  draw: function() {
    var ctx = this._chart.ctx;
    var vm = this._view;
    var left, right, top, bottom, signX, signY, borderSkipped;
    var borderWidth = vm.borderWidth;

    if (!vm.horizontal) {
      // bar
      left = vm.x - vm.width / 2;
      right = vm.x + vm.width / 2;
      top = vm.y;
      bottom = vm.base;
      signX = 1;
      signY = bottom > top? 1: -1;
      borderSkipped = vm.borderSkipped || 'bottom';
    } else {
      // horizontal bar
      left = vm.base;
      right = vm.x;
      top = vm.y - vm.height / 2;
      bottom = vm.y + vm.height / 2;
      signX = right > left? 1: -1;
      signY = 1;
      borderSkipped = vm.borderSkipped || 'left';
    }

    // Canvas doesn't allow us to stroke inside the width so we can
    // adjust the sizes to fit if we're setting a stroke on the line
    if (borderWidth) {
      // borderWidth shold be less than bar width and bar height.
      var barSize = Math.min(Math.abs(left - right), Math.abs(top - bottom));
      borderWidth = borderWidth > barSize? barSize: borderWidth;
      var halfStroke = borderWidth / 2;
      // Adjust borderWidth when bar top position is near vm.base(zero).
      var borderLeft = left + (borderSkipped !== 'left'? halfStroke * signX: 0);
      var borderRight = right + (borderSkipped !== 'right'? -halfStroke * signX: 0);
      var borderTop = top + (borderSkipped !== 'top'? halfStroke * signY: 0);
      var borderBottom = bottom + (borderSkipped !== 'bottom'? -halfStroke * signY: 0);
      // not become a vertical line?
      if (borderLeft !== borderRight) {
        top = borderTop;
        bottom = borderBottom;
      }
      // not become a horizontal line?
      if (borderTop !== borderBottom) {
        left = borderLeft;
        right = borderRight;
      }
    }

    // calculate the bar width and roundess
    var barWidth = Math.abs(left - right);
    var roundness = this._chart.config.options.barRoundness || 0.5;
    var radius = barWidth * roundness * 0.5;

    // keep track of the original top of the bar
    var prevTop = top;

    // move the top down so there is room to draw the rounded top
    top = prevTop + radius;
    var barRadius = top - prevTop;

    ctx.beginPath();
    ctx.fillStyle = vm.backgroundColor;
    ctx.strokeStyle = vm.borderColor;
    ctx.lineWidth = borderWidth;

    // draw the rounded top rectangle
    Chart.helpers.drawRoundedTopRectangle(ctx, left, (top - barRadius + 1), barWidth, bottom - prevTop, barRadius);

    ctx.fill();
    if (borderWidth) {
      ctx.stroke();
    }

    // restore the original top value so tooltips and scales still work
    top = prevTop;
  },
});

Chart.defaults.roundedBar = Chart.helpers.clone(Chart.defaults.bar);

Chart.controllers.roundedBar = Chart.controllers.bar.extend({
  dataElementType: Chart.elements.RoundedTopRectangle
});


$(function(){
	// line carts
	var chartPayout = document.getElementById("js-chart-payout"),
		chartEarnings = document.getElementById("js-chart-earnings"),
		chartRevenue = document.getElementById("js-chart-revenue"),

		chartNewsletters = document.getElementById("js-chart-newsletters"),
		chartSubscribers = document.getElementById("js-chart-subscribers"),
		chartConversion = document.getElementById("js-chart-conversion"),

		// vertical bar charts
		chartProfitQ1 = document.getElementById("js-chart-profit-q1"),
		chartProfitQ2 = document.getElementById("js-chart-profit-q2"),
		chartProfitQ3 = document.getElementById("js-chart-profit-q3"),
		chartProfitQ4 = document.getElementById("js-chart-profit-q4"),
		chartProfitQ5 = document.getElementById("js-chart-profit-q5"),
		chartProfitQ6 = document.getElementById("js-chart-profit-q6"),

		// pie charts
		chartSummary1 = document.getElementById("js-chart-summary1"),
		chartSummary2 = document.getElementById("js-chart-summary2"),
		chartSummary3 = document.getElementById("js-chart-summary3"),

		// used in performance.html page
		chartSales = document.getElementById("js-chart-sales"),
		chartCustomers = document.getElementById("js-chart-customers"),
		chartProfit = document.getElementById("js-chart-profit");

	var lineChartPayoutData = {
	    labels: ["January 1", "January 5", "January 10", "January 15", "January 20", "January 25"],
	    datasets: [{
			label: "Sold",
			fill: true,
			lineTension: 0,
			backgroundColor: 'rgba(163,136,227, 0.1)',
			borderWidth: 2,
			borderColor: "#886CE6",
			borderCapStyle: 'butt',
			borderDash: [],
			borderDashOffset: 0.0,
			borderJoinStyle: 'miter',
			//pointStyle: 'cross',
			pointRadius: 0,
			pointBorderColor: "#fff",
			pointBackgroundColor: "#2a2f37",
			pointBorderWidth: 2,
			pointHoverRadius: 6,
			pointHoverBackgroundColor: "#FC2055",
			pointHoverBorderColor: "#fff",
			pointHoverBorderWidth: 2,
			//pointRadius: 4,
			//pointHitRadius: 5,
			data: [40, 32, 42, 28, 53, 34],
			spanGaps: false
	    }]
	};

	var lineChartEarningsData = {
	    labels: ["January 1", "January 5", "January 10", "January 15", "January 20", "January 25"],
	    datasets: [{
			label: "Sold",
			fill: true,
			lineTension: 0,
			backgroundColor: 'rgba(0,172,255, 0.1)',
			borderWidth: 2,
			borderColor: "#00AAFF",
			borderCapStyle: 'butt',
			borderDash: [],
			borderDashOffset: 0.0,
			borderJoinStyle: 'miter',
			//pointStyle: 'cross',
			pointRadius: 0,
			pointBorderColor: "#fff",
			pointBackgroundColor: "#2a2f37",
			pointBorderWidth: 2,
			pointHoverRadius: 6,
			pointHoverBackgroundColor: "#FC2055",
			pointHoverBorderColor: "#fff",
			pointHoverBorderWidth: 2,
			//pointRadius: 4,
			//pointHitRadius: 5,
			data: [25, 45, 25, 32, 15, 28],
			spanGaps: false
	    }]
	};


	var lineChartRevenueData = {
	    labels: ["1", "4", "7", "10", "13", "16", "19", "22", "25", "28", "31"],
	    datasets: [{
			label: "Revenue",
			fill: true,
			lineTension: 0,
			backgroundColor: 'rgba(0,172,255, 0.1)',
			borderWidth: 2,
			borderColor: "#00AAFF",
			borderCapStyle: 'butt',
			borderDash: [],
			borderDashOffset: 0.0,
			borderJoinStyle: 'miter',
			//pointStyle: 'cross',
			pointRadius: 4,
			pointBorderColor: "#00AAFF",
			pointBackgroundColor: "#fff",
			pointBorderWidth: 2,
			pointHoverRadius: 6,
			pointHoverBackgroundColor: "#fff",
			pointHoverBorderColor: "#00AAFF",
			pointHoverBorderWidth: 2,
			//pointRadius: 4,
			//pointHitRadius: 5,
			data: [20, 24, 32, 34, 38, 35, 37, 40, 53, 60, 62],
			spanGaps: false
	    }, {
	    	label: "Profit",
	        fill: true,
	        lineTension: 0,
	        backgroundColor: 'rgba(163,136,227, 0.1)',
	        borderWidth: 2,
	        borderColor: "#886CE6",
	        pointRadius: 4,
			pointBorderColor: "#886CE6",
			pointBackgroundColor: "#fff",
			pointBorderWidth: 2,
			pointHoverRadius: 6,
			pointHoverBackgroundColor: "#fff",
			pointHoverBorderColor: "#886CE6",
			pointHoverBorderWidth: 2,
	        data: [48, 54, 53, 58 ,56, 62, 61, 59, 76, 78, 80],
	        spanGaps: false
	    }]
	};

	var barChartProfitData = {
	    labels: ["1", "4", "7", "10", "13", "16", "19", "22", "25", "28", "31"],
	    datasets: [{
			label: "Profit",
			fill: true,
			lineTension: 0,
			backgroundColor: '#00AAFF',
			data: [50],
			spanGaps: false
	    }, {
	    	label: "Profit",
	        fill: true,
	        backgroundColor: '#F8E81C',
	        data: [40],
	        spanGaps: false
	    }, {
	    	label: "Profit",
	        fill: true,
	        lineTension: 0,
	        backgroundColor: '#E3B950',
	        data: [25],
	        spanGaps: false
	    }
	    ]
	};

	var lineChartNewslettersData = {
	    labels: ["January 1", "January 5", "January 10", "January 15", "January 20", "January 25"],
	    datasets: [{
			label: "Sold",
			fill: true,
			lineTension: .5,
			backgroundColor: 'rgba(163,136,227, 0.1)',
			borderWidth: 2,
			borderColor: "#886CE6",
			borderCapStyle: 'butt',
			borderDash: [],
			borderDashOffset: 0.0,
			borderJoinStyle: 'miter',
			//pointStyle: 'cross',
			pointRadius: 0,
			pointBorderColor: "#fff",
			pointBackgroundColor: "#2a2f37",
			pointBorderWidth: 2,
			pointHoverRadius: 6,
			pointHoverBackgroundColor: "#FC2055",
			pointHoverBorderColor: "#fff",
			pointHoverBorderWidth: 2,
			//pointRadius: 4,
			//pointHitRadius: 5,
			data: [10, 50, 20, 32, 8, 20],
			spanGaps: false
	    }]
	};

	var lineChartSubscribersData = {
	    labels: ["January 1", "January 5", "January 10", "January 15", "January 20", "January 25"],
	    datasets: [{
			label: "Sold",
			fill: true,
			lineTension: .5,
			backgroundColor: 'rgba(0,170,255, 0.1)',
			borderWidth: 2,
			borderColor: "#00AAFF",
			borderCapStyle: 'butt',
			borderDash: [],
			borderDashOffset: 0.0,
			borderJoinStyle: 'miter',
			//pointStyle: 'cross',
			pointRadius: 0,
			pointBorderColor: "#fff",
			pointBackgroundColor: "#2a2f37",
			pointBorderWidth: 2,
			pointHoverRadius: 6,
			pointHoverBackgroundColor: "#FC2055",
			pointHoverBorderColor: "#fff",
			pointHoverBorderWidth: 2,
			data: [40, 30, 50, 15, 25, 10],
			spanGaps: false
	    }]
	};

	var lineChartConversionData = {
	    labels: ["January 1", "January 5", "January 10", "January 15", "January 20", "January 25"],
	    datasets: [{
			label: "Sold",
			fill: true,
			lineTension: .5,
			backgroundColor: 'rgba(27,185,52, 0.1)',
			borderWidth: 2,
			borderColor: "#1BB934",
			borderCapStyle: 'butt',
			borderDash: [],
			borderDashOffset: 0.0,
			borderJoinStyle: 'miter',
			//pointStyle: 'cross',
			pointRadius: 0,
			pointBorderColor: "#fff",
			pointBackgroundColor: "#2a2f37",
			pointBorderWidth: 2,
			pointHoverRadius: 6,
			pointHoverBackgroundColor: "#FC2055",
			pointHoverBorderColor: "#fff",
			pointHoverBorderWidth: 2,
			//pointRadius: 4,
			//pointHitRadius: 5,
			data: [50, 20, 40, 20, 50, 8],
			spanGaps: false
	    }]
	};

	var barChartSalesData = {
	    labels: ["Day 1", "Day 2", "Day 3", "Day 4", "Day 5", "Day 6", "Day 7", 
	    		 "Day 8", "Day 9", "Day 10", "Day 11", "Day 12", "Day 13", 
	    		 "Day 14", "Day 15", "Day 16", "Day 17", "Day 18", "Day 19", "Day 20",
	    		 "Day 21", "Day 22", "Day 23", "Day 24", 
	    		 "Day 25", "Day 26", "Day 27", "Day 28", "Day 29", "Day 30", "Day 31"],

		datasets: [{
			label: "Sales",
			fill: true,
			backgroundColor: '#1991EB',
			data: [50, 60, 80, 40, 50, 60, 50, 60, 80, 40, 50, 60, 80, 40, 50, 
			60, 50, 60, 80, 40, 50, 60, 80, 40, 50, 60, 50, 60, 80, 40]
		}]
	};

	var barChartCustomersData = {
	    labels: ["January 1", "January 5", "January 10", "January 15", "January 20", "January 25"],
	    datasets: [{
			label: "Sold",
			fill: true,
			lineTension: 0,
			backgroundColor: 'rgba(163,136,227, 0.1)',
			borderWidth: 2,
			borderColor: "#886CE6",
			borderCapStyle: 'butt',
			borderDash: [],
			borderDashOffset: 0.0,
			borderJoinStyle: 'miter',
			//pointStyle: 'cross',
			pointRadius: 0,
			pointBorderColor: "#fff",
			pointBackgroundColor: "#2a2f37",
			pointBorderWidth: 2,
			pointHoverRadius: 6,
			pointHoverBackgroundColor: "#FC2055",
			pointHoverBorderColor: "#fff",
			pointHoverBorderWidth: 2,
			//pointRadius: 4,
			//pointHitRadius: 5,
			data: [40, 32, 42, 28, 53, 34],
			spanGaps: false
	    }]
	};

	var lineChartProfitData = {
	    labels: ["January 1", "January 5", "January 10", "January 15", "January 20", "January 25"],
	    datasets: [{
			label: "Sold",
			fill: true,
			lineTension: 0,
			backgroundColor: 'rgba(163,136,227, 0.1)',
			borderWidth: 2,
			borderColor: "#886CE6",
			borderCapStyle: 'butt',
			borderDash: [],
			borderDashOffset: 0.0,
			borderJoinStyle: 'miter',
			//pointStyle: 'cross',
			pointRadius: 0,
			pointBorderColor: "#fff",
			pointBackgroundColor: "#2a2f37",
			pointBorderWidth: 2,
			pointHoverRadius: 6,
			pointHoverBackgroundColor: "#FC2055",
			pointHoverBorderColor: "#fff",
			pointHoverBorderWidth: 2,
			//pointRadius: 4,
			//pointHitRadius: 5,
			data: [40, 32, 42, 28, 53, 34],
			spanGaps: false
	    }]
	};

	var lineChartProfit2Data = {
	    labels: ["December", "January", "February", "Mars", "April", "May", "June"],
	    datasets: [{
			label: "Sold",
			fill: true,
			lineTension: 0,
			backgroundColor: 'rgba(0,172,255, 0.1)',
			borderWidth: 2,
			borderColor: "#00AAFF",
			borderCapStyle: 'butt',
			borderDash: [],
			borderDashOffset: 0.0,
			borderJoinStyle: 'miter',
			pointStyle: 'circle',
			pointRadius: 0,
			pointBorderColor: "#00AAFF",
			pointBackgroundColor: "#ffffff",
			pointBorderWidth: 2,
			pointHoverRadius: 6,
			pointHoverBackgroundColor: "#00AAFF",
			pointHoverBorderColor: "#fff",
			pointHoverBorderWidth: 2,
			pointRadius: 4,
			pointHitRadius: 5,
			data: [25, 45, 25, 32, 15, 30, 22],
			spanGaps: false
	    }]
	};

	if (chartPayout) {
		var lineChartPayout = new Chart(chartPayout, {
		    type: 'line',
		    data: lineChartPayoutData,
		    options: {
				legend: {
					display: false
				},
				scales: {
					xAxes: [{
							display: false,
							ticks: {
							fontSize: '11',
							fontColor: '#969da5'
						},
						gridLines: {
							color: 'rgba(0,0,0,0.0)',
							zeroLineColor: 'rgba(0,0,0,0.0)'
						}
					}],
					yAxes: [{
						display: false,
						ticks: {
							beginAtZero: true,
							max: 55
						}
					}]
				}
			}
		});
	}

	if (chartEarnings) {
		var lineChartEarnings = new Chart(chartEarnings, {
		    type: 'line',
		    data: lineChartEarningsData,
		    options: {
				legend: {
					display: false
				},
				scales: {
					xAxes: [{
							display: false,
							ticks: {
							fontSize: '11',
							fontColor: '#969da5'
						},
						gridLines: {
							color: 'rgba(0,0,0,0.0)',
							zeroLineColor: 'rgba(0,0,0,0.0)'
						}
					}],
					yAxes: [{
						display: false,
						ticks: {
							beginAtZero: true,
							max: 55
						}
					}]
				}
			}
		});
	}

	if(chartRevenue) {
		var lineChartRevenue = new Chart(chartRevenue, {
		    type: 'line',
		    data: lineChartRevenueData,
		    options: {
				legend: {
					display: true,
					labels: {
		                fontColor: '#7F8FA4',
		                fontFamily: '"Source Sans Pro", sans-serif',
		                boxRadius: 4,
		                usePointStyle: true
		            }
				},
				layout: {
		            padding: {
		                left: 0,
		                right: 0,
		                top: 0,
		                bottom: 0
		            }
		        },
				scales: {
					xAxes: [{
						display: true,
						ticks: {
							fontSize: '11',
							fontColor: '#969da5'
						},
						gridLines: {
							color: 'rgba(0,0,0,0.0)',
							zeroLineColor: 'rgba(0,0,0,0.0)'
						}
					}],
					yAxes: [{
						display: true,	
						gridLines: {
							color: 'rgba(223,226,229,0.45)',
							zeroLineColor: 'rgba(0,0,0,0.0)'
							//tickMarkLength:
						},
						ticks: {
							beginAtZero: true,
							max: 100,
							stepSize: 25,
							fontSize: '11',
							fontColor: '#969da5'
						}
					}]
				}
			}
		});
	}

	if (chartSubscribers) {
		var lineChartSubscribers = new Chart(chartSubscribers, {
		    type: 'line',
		    data: lineChartSubscribersData,
		    options: {
				legend: {
					display: false
				},
				scales: {
					xAxes: [{
							display: false,
							ticks: {
							fontSize: '11',
							fontColor: '#969da5'
						},
						gridLines: {
							color: 'rgba(0,0,0,0.0)',
							zeroLineColor: 'rgba(0,0,0,0.0)'
						}
					}],
					yAxes: [{
						display: false,
						ticks: {
							beginAtZero: true,
							max: 55
						}
					}]
				}
			}
		});
	}

	if (chartNewsletters) {
		var lineChartNewsletters = new Chart(chartNewsletters, {
		    type: 'line',
		    data: lineChartNewslettersData,
		    options: {
				legend: {
					display: false
				},
				scales: {
					xAxes: [{
							display: false,
							ticks: {
							fontSize: '11',
							fontColor: '#969da5'
						},
						gridLines: {
							color: 'rgba(0,0,0,0.0)',
							zeroLineColor: 'rgba(0,0,0,0.0)'
						}
					}],
					yAxes: [{
						display: false,
						ticks: {
							beginAtZero: true,
							max: 55
						}
					}]
				}
			}
		});
	}

	if (chartConversion) {
		var lineChartConversion = new Chart(chartConversion, {
		    type: 'line',
		    data: lineChartConversionData,
		    options: {
				legend: {
					display: false
				},
				scales: {
					xAxes: [{
							display: false,
							ticks: {
							fontSize: '11',
							fontColor: '#969da5'
						},
						gridLines: {
							color: 'rgba(0,0,0,0.0)',
							zeroLineColor: 'rgba(0,0,0,0.0)'
						}
					}],
					yAxes: [{
						display: false,
						ticks: {
							beginAtZero: true,
							max: 55
						}
					}]
				}
			}
		});
	}

	if(chartProfitQ1) {
		var barChartProfit = new Chart(chartProfitQ1, {
		    type: 'bar',
		    data: barChartProfitData,
		    options: {
		    	responsive: true,
		    	maintainAspectRatio: false,
		    	barThickness: 3,
				legend: {
					display: false,
				},
				tooltips: {
					enabled: false
				},
				layout: {
		            padding: {
		                left: 0,
		                right: 0,
		                top: 0,
		                bottom: 0
		            }
		        },
				scales: {
					xAxes: [{
						display: false,
						barThickness : 3
					}],
					yAxes: [{
						display: false
					}]
				}
			}
		});
	}

	if(chartProfitQ2) {
		var barChartProfit = new Chart(chartProfitQ2, {
		    type: 'bar',
		    data: barChartProfitData,
		    options: {
		    	responsive: true,
		    	maintainAspectRatio: false,
				legend: {
					display: false,
				},
				tooltips: {
					enabled: false
				},
				layout: {
		            padding: {
		                left: 0,
		                right: 0,
		                top: 0,
		                bottom: 0
		            }
		        },
				scales: {
					xAxes: [{
						display: false,
						barThickness : 3
					}],
					yAxes: [{
						display: false
					}]
				}
			}
		});
	}

	if(chartProfitQ3) {
		var barChartProfit = new Chart(chartProfitQ3, {
		    type: 'bar',
		    data: barChartProfitData,
		    options: {
		    	responsive: true,
		    	maintainAspectRatio: false,
				legend: {
					display: false,
				},
				tooltips: {
					enabled: false
				},
				layout: {
		            padding: {
		                left: 0,
		                right: 0,
		                top: 0,
		                bottom: 0
		            }
		        },
				scales: {
					xAxes: [{
						display: false,
						barThickness : 3
					}],
					yAxes: [{
						display: false
					}]
				}
			}
		});
	}

	if(chartProfitQ4) {
		var barChartProfit = new Chart(chartProfitQ4, {
		    type: 'bar',
		    data: barChartProfitData,
		    options: {
		    	responsive: true,
		    	maintainAspectRatio: false,
				legend: {
					display: false,
				},
				tooltips: {
					enabled: false
				},
				layout: {
		            padding: {
		                left: 0,
		                right: 0,
		                top: 0,
		                bottom: 0
		            }
		        },
				scales: {
					xAxes: [{
						display: false,
						barThickness : 3
					}],
					yAxes: [{
						display: false
					}]
				}
			}
		});
	}

	if(chartProfitQ5) {
		var barChartProfit = new Chart(chartProfitQ5, {
		    type: 'bar',
		    data: barChartProfitData,
		    options: {
		    	responsive: true,
		    	maintainAspectRatio: false,
				legend: {
					display: false,
				},
				tooltips: {
					enabled: false
				},
				layout: {
		            padding: {
		                left: 0,
		                right: 0,
		                top: 0,
		                bottom: 0
		            }
		        },
				scales: {
					xAxes: [{
						display: false,
						barThickness : 3
					}],
					yAxes: [{
						display: false
					}]
				}
			}
		});
	}

	if(chartProfitQ6) {
		var barChartProfit = new Chart(chartProfitQ6, {
		    type: 'bar',
		    data: barChartProfitData,
		    options: {
		    	responsive: true,
		    	maintainAspectRatio: false,
				legend: {
					display: false,
				},
				tooltips: {
					enabled: false
				},
				layout: {
		            padding: {
		                left: 0,
		                right: 0,
		                top: 0,
		                bottom: 0
		            }
		        },
				scales: {
					xAxes: [{
						display: false,
						barThickness : 3
					}],
					yAxes: [{
						display: false
					}]
				}
			}
		});
	}

	if(chartSummary1) {
		var pieChartSummary = new Chart(chartSummary1, {
			type: 'doughnut',
		    data: {
			    datasets: [{
			        data: [20, 10],
			        backgroundColor: ['#1991EB', '#E2E7EE']
			    }],
			    // These labels appear in the legend and in the tooltips when hovering different arcs
			    labels: [
			        'Red',
			        'Yellow',
			        'Blue'
			    ]
			},
			options: {
				cutoutPercentage: 70,
		    	responsive: false,
		    	maintainAspectRatio: false,
				legend: {
					display: false,
				},
				tooltips: {
					enabled: false
				}
			}
		});
	}

	if(chartSummary2) {
		var pieChartSummary = new Chart(chartSummary2, {
			type: 'doughnut',
		    data: {
			    datasets: [{
			        data: [50, 10],
			        backgroundColor: ['#FDC018', '#E2E7EE']
			    }],
			    // These labels appear in the legend and in the tooltips when hovering different arcs
			    labels: [
			        'Red',
			        'Yellow',
			        'Blue'
			    ]
			},
			options: {
				cutoutPercentage: 70,
		    	responsive: false,
		    	maintainAspectRatio: false,
				legend: {
					display: false,
				},
				tooltips: {
					enabled: false
				}
			}
		});
	}

	if(chartSummary3) {
		var pieChartSummary = new Chart(chartSummary3, {
			type: 'doughnut',
		    data: {
			    datasets: [{
			        data: [5, 10],
			        backgroundColor: ['#8261E6', '#E2E7EE']
			    }],
			    // These labels appear in the legend and in the tooltips when hovering different arcs
			    labels: [
			        'Red',
			        'Yellow',
			        'Blue'
			    ]
			},
			options: {
				cutoutPercentage: 70,
		    	responsive: false,
		    	maintainAspectRatio: false,
				legend: {
					display: false,
				},
				tooltips: {
					enabled: false
				}
			}
		});
	}

	if(chartSales) {
		var barChartSales = new Chart(chartSales, {
		    type: 'roundedBar', 
		    data: barChartSalesData,
		    options: {
		    	legend: {
					display: false
				},
		    	barRoundness: 1,
		    	responsive: true,
		    	maintainAspectRatio: true,
		    	scales: {
					xAxes: [{
							display: false,
							ticks: {
							fontSize: '11',
							fontColor: '#969da5'
						},
						gridLines: {
							color: 'rgba(0,0,0,0.0)',
							zeroLineColor: 'rgba(0,0,0,0.0)'
						}
					}],
					yAxes: [{
						display: false,
						ticks: {
							beginAtZero: true,
							max: 100
						}
					}]
				}
			}
		});
	}

	if(chartCustomers) {
		var doChartCustomers = new Chart(chartCustomers, {
			type: 'doughnut',
		    data: {
			    datasets: [{
			        data: [60, 25, 15],
			        backgroundColor: ['#289DF5', '#40557D', '#FFD400']
			    }],
			    // These labels appear in the legend and in the tooltips when hovering different arcs
			    labels: [
			        'Blue',
			        'Dark',
			        'Yellow'
			    ]
			},
			options: {
				cutoutPercentage: 70,
		    	responsive: false,
		    	maintainAspectRatio: false,
				legend: {
					display: false,
				},
				tooltips: {
					enabled: false
				}
			}
		});
	}

	if (chartProfit) {
		var lineChartProfit = new Chart(chartProfit, {
		    type: 'line',
		    data: lineChartProfit2Data,
		    options: {
		    	legend: {
					display: false
				},
				scales: {
					xAxes: [{
							display: false,
							ticks: {
							fontSize: '11',
							fontColor: '#969da5'
						},
						gridLines: {
							color: 'rgba(0,0,0,0.0)',
							zeroLineColor: 'rgba(0,0,0,0.0)'
						}
					}],
					yAxes: [{
						display: false,
						ticks: {
							beginAtZero: true,
							max: 55
						}
					}]
				}
			}
		});
	}
});
