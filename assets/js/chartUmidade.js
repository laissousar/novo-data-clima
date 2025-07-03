
console.log("chartUmidade.js carregado. Definindo updateHourlyUmidadeChart...");

/**
 * Updates or creates the hourly humidity average chart.
 * This function expects 'hourlyUmiChartInstance' to be a globally accessible variable.
 * @param {Array<string>} labels - The labels for the X-axis (hours of the day).
 * @param {Array<number|string>} data - The data for the Y-axis (average humidity).
 */
function updateHourlyUmidadeChart(labels, data) {
    console.log("updateHourlyUmidadeChart chamada com:", { labels, data }); // Debug log
    const ctx = document.getElementById('hourlyUmiChart').getContext('2d');

    // Check if context is valid
    if (!ctx) {
        console.error("Canvas context for 'hourlyUmiChart' not found.");
        return;
    }

    if (hourlyUmiChartInstance) {
        hourlyUmiChartInstance.data.labels = labels;
        hourlyUmiChartInstance.data.datasets[0].data = data;
        hourlyUmiChartInstance.update(); 
    } else {
        hourlyUmiChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Média de Umidade',
                    data: data,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Hora do Dia'
                        }
                    },
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'Umidade Média (%)'
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.raw}%`;
                            }
                        }
                    }
                }
            }
        });
    }
}