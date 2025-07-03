// Remova esta linha, pois 'hourlyTempChartInstance' é declarada em script.js
// hourlyTempChartInstance = null;

// O restante do código permanece o mesmo
console.log("scriptChartsTemp.js carregado. Definindo updateHourlyTemperatureChart...");

/**
 * Atualiza ou cria o gráfico de médias de temperatura por hora.
 * Esta função espera que 'hourlyTempChartInstance' seja uma variável acessível globalmente.
 * @param {Array<string>} labels - Os rótulos para o eixo X (horas do dia).
 * @param {Array<number|string>} data - Os dados para o eixo Y (temperaturas médias).
 */
function updateHourlyTemperatureChart(labels, data) {
    console.log("updateHourlyTemperatureChart chamada com:", { labels, data }); // Log quando a função é chamada

    const ctx = document.getElementById('hourlyTempChart').getContext('2d');

    if (!ctx) {
        console.error("ERRO: Elemento canvas com ID 'hourlyTempChart' não encontrado ou contexto 2D indisponível.");
        return; // Sai da função se o canvas não for encontrado
    }

    if (hourlyTempChartInstance) {

        hourlyTempChartInstance.destroy();
        console.log("Instância de hourlyTempChart destruída para atualização.");
    }

    
    hourlyTempChartInstance = new Chart(ctx, {
        type: 'bar', 
        data: {
            labels: labels,
            datasets: [{
                label: 'Média de Temperatura',
                data: data,
                backgroundColor: 'rgba(255, 99, 132, 0.6)', 
                borderColor: 'rgba(255, 99, 132, 1)',
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
                        text: 'Temperatura Média (°C)'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw}°C`;
                        }
                    }
                }
            }
        }
    });
    console.log("Novo hourlyTempChartInstance criado.");
}