
let hourlyTempChartInstance = null;
let hourlyUmiChartInstance = null;

let selectedDate = new Date(); // Padrão para a data atual (Hoje)

async function fetchData() {
    console.log("Iniciando busca de dados para a data:", selectedDate.toDateString()); // Log de depuração

    const formatDateForAPI = (date) => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Mês é base 0
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };


    const displayDateElement = document.getElementById('displayDate');
    if (displayDateElement) {
        displayDateElement.textContent = selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }

    try {
        const response = await fetch('https://climaalert-production.up.railway.app/sensor/api/listar/');
        if (!response.ok) {
            throw new Error(`Erro de rede ou API: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();


        if (!Array.isArray(data) || data.length === 0) {
            console.warn("API retornou nenhum dado ou formato de dado inválido.");

            document.getElementById('nivel-calor').textContent = 'N/A';
            document.getElementById('info-nivel-calor').textContent = 'N/A';
            document.getElementById('nivel-risco').textContent = 'N/A';
            document.getElementById('temperatura').textContent = 'N/A';
            document.getElementById('umidade').textContent = 'N/A';
            document.getElementById('hora').textContent = 'N/A';

            if (hourlyTempChartInstance) { hourlyTempChartInstance.data.datasets[0].data = []; hourlyTempChartInstance.update(); }
            if (hourlyUmiChartInstance) { hourlyUmiChartInstance.data.datasets[0].data = []; hourlyUmiChartInstance.update(); }
            return; 
        }

        const dateToFilter = formatDateForAPI(selectedDate);
        console.log("Filtrando dados para a string de data:", dateToFilter); 

        const filteredData = data.filter(entry => {

            if (entry.hora && typeof entry.hora === 'string' && entry.hora.length >= 10) {
                const entryDatePart = entry.hora.substring(0, 10);
                return entryDatePart === dateToFilter;
            }
            return false;
        });

        if (filteredData.length === 0) {
            console.warn(`Nenhum dado disponível para a data selecionada: ${selectedDate.toDateString()}. Tentando buscar o último registro geral.`);

            const lastEntryOverall = data[0]; 
            document.getElementById('nivel-calor').textContent = `${lastEntryOverall["índice de calor"]}`;
            document.getElementById('info-nivel-calor').textContent = `${lastEntryOverall["índice de calor"]}`;
            document.getElementById('nivel-risco').textContent = `${lastEntryOverall["nível de risco"]}`;
            document.getElementById('temperatura').textContent = `${lastEntryOverall.temperatura}`;
            document.getElementById('umidade').textContent = `${lastEntryOverall.umidade}`;
            document.getElementById('hora').textContent = `${lastEntryOverall.hora}`;
            
            if (hourlyTempChartInstance) { hourlyTempChartInstance.data.labels = []; hourlyTempChartInstance.data.datasets[0].data = []; hourlyTempChartInstance.update(); }
            if (hourlyUmiChartInstance) { hourlyUmiChartInstance.data.labels = []; hourlyUmiChartInstance.data.datasets[0].data = []; hourlyUmiChartInstance.update(); }
            return;
        }

        const lastEntry = filteredData.reduce((latest, current) => {
            const parseDateString = (dateStr) => {
                const [datePart, timePart] = dateStr.split(' ');
                const [day, month, year] = datePart.split('/');
                return new Date(`${month}/${day}/${year} ${timePart}`);
            };
            const latestTime = parseDateString(latest.hora).getTime();
            const currentTime = parseDateString(current.hora).getTime();
            return currentTime > latestTime ? current : latest;
        });


        document.getElementById('nivel-calor').textContent = `${lastEntry["índice de calor"]}`;
        document.getElementById('info-nivel-calor').textContent = `${lastEntry["índice de calor"]}`;
        document.getElementById('nivel-risco').textContent = `${lastEntry["nível de risco"]}`;
        document.getElementById('temperatura').textContent = `${lastEntry.temperatura}`;
        document.getElementById('umidade').textContent = `${lastEntry.umidade}`;
        document.getElementById('hora').textContent = `${lastEntry.hora}`;

        const hourlyTemps = {};
        const hourlyUmis = {};

        const now = new Date();
        const currentHour = now.getHours();
        const isToday = selectedDate.toDateString() === now.toDateString();

        filteredData.forEach(entry => {
            if (entry.hora && typeof entry.hora === 'string' && entry.hora.length >= 13) {
                const hour = parseInt(entry.hora.substring(11, 13), 10); 

                if (isToday && hour > currentHour) {
                    return;
                }

                if (typeof entry.temperatura === 'number') {
                    if (!hourlyTemps[hour]) {
                        hourlyTemps[hour] = [];
                    }
                    hourlyTemps[hour].push(entry.temperatura);
                }
                if (typeof entry.umidade === 'number') {
                    if (!hourlyUmis[hour]) {
                        hourlyUmis[hour] = [];
                    }
                    hourlyUmis[hour].push(entry.umidade);
                }
            }
        });

        const chartLabels = [];
        const chartDataTemp = [];
        const chartDataUmi = [];

        let endLoopHour = 18; 
        if (isToday && currentHour < 18) {
            endLoopHour = currentHour; 
        }

        for (let h = 8; h <= endLoopHour; h++) {
            const hourKey = String(h).padStart(2, '0');
            const tempsForHour = hourlyTemps[h] || [];
            const umisForHour = hourlyUmis[h] || [];

            let hourlyAverageTemp = 'N/A';
            let hourlyAverageUmi = 'N/A';

            if (tempsForHour.length > 0) {
                const sumTemp = tempsForHour.reduce((acc, temp) => acc + temp, 0);
                hourlyAverageTemp = (sumTemp / tempsForHour.length).toFixed(2);
            }
            if (umisForHour.length > 0) {
                const sumUmi = umisForHour.reduce((acc, umi) => acc + umi, 0);
                hourlyAverageUmi = (sumUmi / umisForHour.length).toFixed(2);
            }

            chartLabels.push(`${hourKey}h`);
            chartDataTemp.push(hourlyAverageTemp === 'N/A' ? null : parseFloat(hourlyAverageTemp));
            chartDataUmi.push(hourlyAverageUmi === 'N/A' ? null : parseFloat(hourlyAverageUmi));
        }

        if (typeof updateHourlyTemperatureChart === 'function') {
            updateHourlyTemperatureChart(chartLabels, chartDataTemp);
        } else {
            console.error("Função 'updateHourlyTemperatureChart' não encontrada. Verifique o carregamento de chartTemp.js.");
        }

        if (typeof updateHourlyUmidadeChart === 'function') {
            updateHourlyUmidadeChart(chartLabels, chartDataUmi);
        } else {
            console.error("Função 'updateHourlyUmidadeChart' não encontrada. Verifique o carregamento de chartUmidade.js.");
        }

    } catch (error) {
        console.error('Erro ao buscar ou processar os dados da API:', error);

        document.getElementById('nivel-calor').textContent = 'Erro';
        document.getElementById('info-nivel-calor').textContent = 'Erro';
        document.getElementById('nivel-risco').textContent = 'Erro';
        document.getElementById('temperatura').textContent = 'Erro';
        document.getElementById('umidade').textContent = 'Erro';
        document.getElementById('hora').textContent = 'Erro';
        if (hourlyTempChartInstance) { hourlyTempChartInstance.data.datasets[0].data = []; hourlyTempChartInstance.update(); }
        if (hourlyUmiChartInstance) { hourlyUmiChartInstance.data.datasets[0].data = []; hourlyUmiChartInstance.update(); }
    }
}

/**
 * Define a data para buscar e exibir os dados nos gráficos.
 * @param {number} daysOffset 
 */
function setDateForCharts(daysOffset) {
    selectedDate = new Date(); 
    selectedDate.setDate(selectedDate.getDate() + daysOffset); 
    fetchData(); 
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM completamente carregado. Inicializando fetchData...");


    setDateForCharts(0);


    const btnToday = document.getElementById('btnToday');
    const btnYesterday = document.getElementById('btnYesterday');

    if (btnToday) {
        btnToday.addEventListener('click', () => setDateForCharts(0));
    } else {
        console.error("ERRO: Botão com ID 'btnToday' não encontrado.");
    }

    if (btnYesterday) {
        btnYesterday.addEventListener('click', () => setDateForCharts(-1));
    } else {
        console.error("ERRO: Botão com ID 'btnYesterday' não encontrado.");
    }

    setInterval(() => {
        const now = new Date();
        if (selectedDate.toDateString() === now.toDateString()) {
            console.log("Atualizando dados para o dia atual...");
            fetchData();
        } else {
            console.log("Não atualizando dados automaticamente pois não é o dia atual.");
        }
    }, 100 * 1000);
});