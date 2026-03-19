// chart.js - 修复版本

// 光谱图表功能
let spectrumChart = null;
let chartData = {};
let isChartInitialized = false;

// 初始化图表
function initSpectrumChart() {
    console.log('初始化光谱图表...');
    
    const chartDom = document.getElementById('spectrum-chart');
    if (!chartDom) {
        console.error('图表容器未找到');
        return;
    }
    
    try {
        // 初始化 ECharts 实例
        spectrumChart = echarts.init(chartDom);
        
        // 设置默认的空图表配置
        const option = {
            title: {
                text: '岩石光谱曲线',
                left: 'center',
                textStyle: {
                    fontSize: 16,
                    fontWeight: 'normal'
                }
            },
            tooltip: {
                trigger: 'axis',
                formatter: function(params) {
                    if (!params || params.length === 0) return '';
                    return `波长: ${params[0].axisValue} nm<br>反射率: ${params[0].data[1].toFixed(2)+'%'}`;
                }
            },
            legend: {
                show: false,
                data: []
            },
            grid: {
                left: '8%',
                right: '5%',
                bottom: '10%',
                top: '20%',
                containLabel: true
            },
            xAxis: {
                type: 'value',
                name: '波长 (nm)',
                nameLocation: 'middle',
                nameGap: 25,
                nameTextStyle: {
                    fontSize: 12
                },
                min: 350,
                max: 2500,
                splitLine: {
                    show: true,
                    lineStyle: {
                        type: 'dashed',
                        opacity: 0.3
                    }
                }
            },
            yAxis: {
                type: 'value',
                name: '反射率 (%)',
                min: 0,
                max: 100,
                splitLine: {
                    show: true,
                    lineStyle: {
                        type: 'dashed',
                        opacity: 0.3
                    }
                }
            },
            series: [{
                name: '光谱曲线',
                type: 'line',
                data: [],
                symbol: 'none',
                smooth: true,
                lineStyle: {
                    width: 2,
                    color: '#3498db'
                },
                itemStyle: {
                    color: '#3498db'
                },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(52, 152, 219, 0.3)' },
                        { offset: 1, color: 'rgba(52, 152, 219, 0.1)' }
                    ])
                }
            }]
        };
        
        // 设置图表选项
        spectrumChart.setOption(option, true);
        isChartInitialized = true;
        
        console.log('图表初始化成功');
        
        // 窗口大小变化时重绘图表
        window.addEventListener('resize', function() {
            if (spectrumChart && !spectrumChart.isDisposed()) {
                spectrumChart.resize();
            }
        });
        
    } catch (error) {
        console.error('图表初始化失败:', error);
        showAlert('图表初始化失败: ' + error.message, 'error');
    }
}

// 加载光谱数据
async function loadSpectrumData(rock) {
    console.log('加载光谱数据:', rock.id);
    
    if (!rock.spectrum) {
        showAlert('该样本没有光谱数据', 'warning');
        return;
    }
    
    // 确保图表已初始化
    if (!isChartInitialized) {
        initSpectrumChart();
    }
    
    if (!spectrumChart || spectrumChart.isDisposed()) {
        console.error('图表未初始化或已销毁');
        return;
    }
    
    try {
        // 显示加载状态
        spectrumChart.showLoading('default', {
            text: '加载光谱数据中...',
            color: '#3498db',
            textColor: '#333',
            maskColor: 'rgba(255, 255, 255, 0.8)'
        });
        
        // 解析CSV文件
        const response = await fetch(`data/spectra/${rock.spectrum}`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: 无法加载光谱文件`);
        }
        
        const csvText = await response.text();
        console.log('CSV文本长度:', csvText.length);
        
        // 解析CSV数据
        const lines = csvText.trim().split('\n');
        console.log('CSV行数:', lines.length);
        
        // 解析数据点
        const dataPoints = [];
        let minWavelength = Infinity;
        let maxWavelength = -Infinity;
        let minReflectance = Infinity;
        let maxReflectance = -Infinity;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            // 分割逗号分隔的值
            const parts = line.split(',');
            if (parts.length < 2) continue;
            
            // 转换为数字
            const wavelength = parseFloat(parts[0]);
            const reflectance = parseFloat(parts[1]);
            
            if (isNaN(wavelength) || isNaN(reflectance)) {
                console.warn(`第 ${i + 1} 行数据格式错误: ${line}`);
                continue;
            }
            
            dataPoints.push([wavelength, reflectance]);
            
            // 更新范围
            minWavelength = Math.min(minWavelength, wavelength);
            maxWavelength = Math.max(maxWavelength, wavelength);
            minReflectance = Math.min(minReflectance, reflectance);
            maxReflectance = Math.max(maxReflectance, reflectance);
        }
        
        console.log(`解析成功: ${dataPoints.length} 个数据点`);
        console.log(`波长范围: ${minWavelength} - ${maxWavelength} nm`);
        console.log(`反射率范围: ${minReflectance.toFixed(4)} - ${maxReflectance.toFixed(4)}`);
        
        if (dataPoints.length === 0) {
            throw new Error('没有找到有效的光谱数据');
        }
        
        // 更新图表
        updateChart(rock, dataPoints, minWavelength, maxWavelength, minReflectance, maxReflectance);
        
        // 保存数据供对比使用
        chartData[rock.id] = {
            dataPoints: dataPoints,
            rock: rock,
            minWavelength: minWavelength,
            maxWavelength: maxWavelength,
            minReflectance: minReflectance,
            maxReflectance: maxReflectance
        };
        
        spectrumChart.hideLoading();
        console.log('光谱数据加载完成');
        
    } catch (error) {
        console.error('加载光谱数据失败:', error);
        spectrumChart.hideLoading();
        showAlert('加载光谱数据失败: ' + error.message, 'error');
        
        // 显示错误信息
        const option = {
            title: {
                text: '加载光谱数据失败',
                subtext: error.message,
                left: 'center',
                top: 'center',
                textStyle: {
                    color: '#e74c3c',
                    fontSize: 16
                },
                subtextStyle: {
                    color: '#7f8c8d',
                    fontSize: 12
                }
            },
            xAxis: { show: false },
            yAxis: { show: false },
            series: []
        };
        
        if (spectrumChart && !spectrumChart.isDisposed()) {
            spectrumChart.setOption(option, true);
        }
    }
}

// 更新图表
function updateChart(rock, dataPoints, minWavelength, maxWavelength, minReflectance, maxReflectance) {
    console.log('更新图表数据...');
    
    if (!spectrumChart || spectrumChart.isDisposed()) {
        console.error('图表未初始化');
        return;
    }
    
    try {
        // 准备图表选项
        const option = {
            title: {
                text: `${rock.sample_id || rock.id} - ${rock.rock_type}`,
                subtext: `波长: ${minWavelength.toFixed(0)}-${maxWavelength.toFixed(0)}nm | 采样点: ${dataPoints.length}`,
                left: 'center',
                textStyle: {
                    fontSize: 16,
                    fontWeight: 'bold'
                },
                subtextStyle: {
                    fontSize: 12,
                    color: '#7f8c8d'
                }
            },
            legend: {
                show: false
            },
            xAxis: {
                type: 'value',
                name: '波长 (nm)',
                min: Math.max(340, Math.floor(minWavelength / 100) * 100),
                max: Math.ceil(maxWavelength / 100) * 100,
                axisLabel: {
                    formatter: function(value) {
                        return value.toFixed(0);
                    }
                }
            },
            yAxis: {
                type: 'value',
                name: '反射率 (%)',
                min: Math.max(0, Math.floor(minReflectance * 10) / 10 - 5),
                max: Math.ceil(maxReflectance * 10) / 10 + 5,
                axisLabel: {
                    formatter: function(value) {
                        return value.toFixed(2) + '%';
                    }
                }
            },
            series: [{
                name: rock.sample_id || rock.id,
                type: 'line',
                data: dataPoints,
                symbol: 'none',
                smooth: true,
                lineStyle: {
                    width: 2,
                    color: '#3498db'
                },
                itemStyle: {
                    color: '#3498db'
                },
                areaStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: 'rgba(52, 152, 219, 0.3)' },
                        { offset: 1, color: 'rgba(52, 152, 219, 0.05)' }
                    ])
                }
            }],
            tooltip: {
                trigger: 'axis',
                formatter: function(params) {
                    const point = params[0];
                    return `
                        <div style="font-weight: bold; margin-bottom: 5px;">${rock.sample_id || rock.id}</div>
                        <div>波长: <b>${point.axisValue.toFixed(1)} nm</b></div>
                        <div>反射率: <b>${point.data[1].toFixed(2)+'%'}</b></div>
                    `;
                }
            },
            dataZoom: [{
                type: 'inside',
                xAxisIndex: 0,
                start: 0,
                end: 100
            }, {
                type: 'inside',
                yAxisIndex: 0,
                start: 0,
                end: 100
            }]
        };
        
        // 更新图表
        spectrumChart.setOption(option, true);
        console.log('图表更新完成');
        
    } catch (error) {
        console.error('更新图表失败:', error);
        showAlert('更新图表失败: ' + error.message, 'error');
    }
}

// 对比多个光谱
function compareSpectra() {
    console.log('对比光谱，样本数:', compareList.length);
    
    if (!spectrumChart || spectrumChart.isDisposed()) {
        console.error('图表未初始化');
        return;
    }
    
    if (compareList.length === 0) {
        showAlert('请先添加要对比的样本', 'warning');
        return;
    }
    
    try {
        const series = [];
        const legendData = [];
        const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
        
        // 收集所有数据点以确定坐标轴范围
        let allMinWavelength = Infinity;
        let allMaxWavelength = -Infinity;
        let allMinReflectance = Infinity;
        let allMaxReflectance = -Infinity;
        
        compareList.forEach((rockId, index) => {
            const data = chartData[rockId];
            if (!data) {
                console.warn(`样本 ${rockId} 的光谱数据未加载`);
                return;
            }
            
            // 更新全局范围
            allMinWavelength = Math.min(allMinWavelength, data.minWavelength);
            allMaxWavelength = Math.max(allMaxWavelength, data.maxWavelength);
            allMinReflectance = Math.min(allMinReflectance, data.minReflectance);
            allMaxReflectance = Math.max(allMaxReflectance, data.maxReflectance);
            
            // 创建系列
            series.push({
                name: data.rock.sample_id || data.rock.id,
                type: 'line',
                data: data.dataPoints,
                symbol: 'none',
                smooth: true,
                lineStyle: {
                    width: 2,
                    color: colors[index % colors.length]
                },
                itemStyle: {
                    color: colors[index % colors.length]
                }
            });
            
            legendData.push(data.rock.sample_id || data.rock.id);
        });
        
        if (series.length === 0) {
            showAlert('没有可对比的光谱数据', 'warning');
            return;
        }
        
        const option = {
            title: {
                text: '光谱对比图',
                subtext: `对比 ${series.length} 个样本的光谱曲线`,
                left: 'center'
            },
            legend: {
                data: legendData,
                top: 360,
                type: 'scroll'
            },
            xAxis: {
                type: 'value',
                name: '波长 (nm)',
                min: Math.max(340, Math.floor(allMinWavelength / 100) * 100),
                max: Math.ceil(allMaxWavelength / 100) * 100
            },
            yAxis: {
                type: 'value',
                name: '反射率 (%)',
                min: Math.max(0, Math.floor(allMinReflectance * 10) / 10 -5),
                max: Math.ceil(allMaxReflectance * 10) / 10 + 5
            },
            series: series,
            tooltip: {
                trigger: 'axis',
                axisPointer: {
                    type: 'cross'
                }
            },
            dataZoom: [{
                type: 'inside',
                xAxisIndex: 0
            }]
        };
        
        spectrumChart.setOption(option, true);
        console.log('光谱对比图表已更新');
        
    } catch (error) {
        console.error('对比光谱失败:', error);
        showAlert('对比光谱失败: ' + error.message, 'error');
    }
}

// 显示提示信息
function showAlert(message, type = 'info') {
    const alertClass = {
        'info': 'alert-info',
        'success': 'alert-success',
        'warning': 'alert-warning',
        'error': 'alert-danger'
    }[type];
    
    // 创建提示元素
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert ${alertClass} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = `
        top: 80px;
        right: 20px;
        z-index: 1050;
        min-width: 250px;
        max-width: 300px;
    `;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    // 添加到页面
    document.body.appendChild(alertDiv);
    
    // 3秒后自动移除
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 3000);
}

// 图表控制功能
function initChartControls() {
    console.log('初始化图表控制...');
    
    // 平滑曲线切换
    const toggleSmoothBtn = document.getElementById('toggle-smooth');
    if (toggleSmoothBtn) {
        toggleSmoothBtn.addEventListener('click', function() {
            if (!spectrumChart || spectrumChart.isDisposed()) return;
            
            const option = spectrumChart.getOption();
            if (option.series && option.series.length > 0) {
                const smooth = !option.series[0].smooth;
                option.series.forEach(series => {
                    series.smooth = smooth;
                });
                spectrumChart.setOption(option);
                this.innerHTML = smooth ? 
                    '<i class="fas fa-wave-square"></i> 原始曲线' : 
                    '<i class="fas fa-wave-square"></i> 平滑曲线';
            }
        });
    }
    
    // 显示数据点
    const togglePointsBtn = document.getElementById('toggle-points');
    if (togglePointsBtn) {
        togglePointsBtn.addEventListener('click', function() {
            if (!spectrumChart || spectrumChart.isDisposed()) return;
            
            const option = spectrumChart.getOption();
            if (option.series && option.series.length > 0) {
                const showSymbol = option.series[0].symbol === 'none';
                const symbol = showSymbol ? 'circle' : 'none';
                const symbolSize = showSymbol ? 4 : 0;
                
                option.series.forEach(series => {
                    series.symbol = symbol;
                    series.symbolSize = symbolSize;
                });
                spectrumChart.setOption(option);
                this.innerHTML = showSymbol ? 
                    '<i class="fas fa-circle"></i> 隐藏数据点' : 
                    '<i class="fas fa-circle"></i> 显示数据点';
            }
        });
    }
    
    // 下载图表
    const downloadChartBtn = document.getElementById('download-chart');
    if (downloadChartBtn) {
        downloadChartBtn.addEventListener('click', function() {
            if (!spectrumChart || spectrumChart.isDisposed()) {
                showAlert('图表未初始化', 'warning');
                return;
            }
            
            try {
                const imgData = spectrumChart.getDataURL({
                    type: 'png',
                    pixelRatio: 2,
                    backgroundColor: '#fff'
                });
                
                const link = document.createElement('a');
                link.href = imgData;
                link.download = `光谱图表_${new Date().getTime()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                showAlert('图表下载成功', 'success');
            } catch (error) {
                console.error('下载图表失败:', error);
                showAlert('下载图表失败: ' + error.message, 'error');
            }
        });
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM加载完成，初始化图表...');
    
    // 延迟初始化图表，确保DOM完全渲染
    setTimeout(() => {
        initSpectrumChart();
        initChartControls();
    }, 100);
});