// search.js - 修复版本

// 应用筛选条件
function applyFilters() {
    console.log('应用筛选条件...');
    
    // 安全检查
    const rockTypeFilter = document.getElementById('rock-type-filter');
    const locationFilter = document.getElementById('location-filter');
    const quickSearch = document.getElementById('quick-search');
    
    if (!rockTypeFilter || !locationFilter || !quickSearch) {
        console.error('筛选元素未找到');
        return;
    }
    
    const searchText = quickSearch.value.toLowerCase();
    
    // 安全获取选中的岩性
    let selectedTypes = [];
    try {
        selectedTypes = Array.from(rockTypeFilter.selectedOptions)
            .map(opt => opt.value)
            .filter(val => val); // 过滤空值
    } catch (error) {
        console.warn('获取岩性选项失败:', error);
    }
    
    const selectedLocation = locationFilter.value;
    
    // 筛选数据
    filteredData = rockData.filter(rock => {
        // 文本搜索
        const textMatch = !searchText || 
            (rock.lithology && rock.lithology.toLowerCase().includes(searchText)) ||
            (rock.location && rock.location.toLowerCase().includes(searchText)) ||
            (rock.id && rock.id.toLowerCase().includes(searchText));
        
        // 岩性筛选
        const typeMatch = selectedTypes.length === 0 || 
            (rock.rock_type && selectedTypes.includes(rock.rock_type));
        
        // 位置筛选
        const locationMatch = !selectedLocation || rock.location === selectedLocation;
        
        return textMatch && typeMatch && locationMatch;
    });
    
    // 更新显示
    currentPage = 1;
    displayResults();
    updateStats();
    
    console.log('筛选完成，结果数:', filteredData.length);
}

// 修改 resetFilters 函数，添加安全检查
function resetFilters() {
    console.log('重置筛选条件...');
    
    // 获取所有需要的元素
    const elements = {
        rockTypeFilter: document.getElementById('rock-type-filter'),
        locationFilter: document.getElementById('location-filter'),
        quickSearch: document.getElementById('quick-search'),
        minWave: document.getElementById('min-wave'),
        maxWave: document.getElementById('max-wave'),
        resetBtn: document.getElementById('reset-filter')
    };
    
    // 检查元素是否存在
    for (const [name, element] of Object.entries(elements)) {
        if (!element && name !== 'resetBtn') {
            console.warn(`元素 ${name} 未找到`);
            return;
        }
    }
    
    // 重置值
    elements.quickSearch.value = '';
    
    // 重置多选框（需要检查是否是 multiple）
    if (elements.rockTypeFilter && elements.rockTypeFilter.multiple) {
        for (let i = 0; i < elements.rockTypeFilter.options.length; i++) {
            elements.rockTypeFilter.options[i].selected = false;
        }
    }
    
    // 重置下拉框
    if (elements.locationFilter) {
        elements.locationFilter.selectedIndex = 0;
    }
    
    // 重置波长范围
    if (elements.minWave) elements.minWave.value = '';
    if (elements.maxWave) elements.maxWave.value = '';
    
    // 重置数据
    filteredData = [...rockData];
    currentPage = 1;
    
    // 更新显示
    displayResults();
    updateStats();
    
    
    // 隐藏重置按钮
    if (elements.resetBtn) {
        elements.resetBtn.style.display = 'none';
    }
    
    console.log('筛选条件已重置');
}

// 其他函数保持不变...

// 切换视图
function toggleView() {
    const toggleBtn = document.getElementById('toggle-view');
    const listView = document.getElementById('list-view');
    const gridView = document.getElementById('grid-view');
    
    if (toggleBtn.dataset.view === 'list') {
        // 切换到网格视图
        toggleBtn.dataset.view = 'grid';
        toggleBtn.innerHTML = '<i class="fas fa-th"></i> 网格视图';
        listView.style.display = 'none';
        gridView.style.display = 'block';
    } else {
        // 切换到列表视图
        toggleBtn.dataset.view = 'list';
        toggleBtn.innerHTML = '<i class="fas fa-list"></i> 列表视图';
        listView.style.display = 'block';
        gridView.style.display = 'none';
    }
    
    displayResults();
}

// 显示样本详情
function showDetail(rockId) {
    const rock = rockData.find(r => r.id === rockId);
    if (!rock) return;
    
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    
    modalTitle.textContent = `${rock.id || rock.sample_id} - ${rock.rock_type || '未知岩性'}`;
    
    // 构建详情内容
    const detailHtml = `
        <div class="row">
            <div class="col-md-6">
                <div class="text-center mb-3">
                    <img src="rocks/${rock.image}" 
                         class="img-fluid rounded" 
                         alt="${rock.rock_type}"
                         style="max-height: 300px;"
                         onerror="this.src='images/rocks/default.jpg'">
                </div>
                
                <div class="card mb-3">
                    <div class="card-header">样本信息</div>
                    <div class="card-body">
                        <table class="table table-sm">
                            <tr>
                                <th>岩性:</th>
                                <td><span class="badge" 
                                        style="background-color: ${getRockTypeColor(rock.rock_type)}; color: white;">
                                    ${rock.rock_type || '未知'}
                                </span></td>
                            </tr>
                            <tr>
                                <th>具体岩性:</th>
                                <td>${rock.lithology || '未知'}</td>
                            </tr>
                            <tr>
                                <th>位置:</th>
                                <td>${rock.location || '未知'}</td>
                            </tr>
                            <tr>
                                <th>坐标:</th>
                                <td>${rock.coordinates || '未知'}</td>
                            </tr>
                            <tr>
                                <th>时代:</th>
                                <td>${rock.formation_age || '未知'}</td>
                            </tr>
                            <tr>
                                <th>采集人:</th>
                                <td>${rock.collector || '未知'}</td>
                            </tr>
                            <tr>
                                <th>采集日期:</th>
                                <td>${rock.collection_date || '未知'}</td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
            
            <div class="col-md-6">
                <div class="card">
                    <div class="card-header">光谱信息</div>
                    <div class="card-body">
                        ${rock.spectrum ? 
                            `<p><i class="fas fa-check text-success"></i> 有光谱数据</p>
                             <button class="btn btn-primary w-100 mb-2" onclick="loadSpectrumData(${JSON.stringify(rock).replace(/"/g, '&quot;')})">
                                 <i class="fas fa-chart-line"></i> 查看光谱
                             </button>
                             <button class="btn btn-info w-100" onclick="addToCompare('${rock.id}')">
                                 <i class="fas fa-plus"></i> 添加到对比
                             </button>` : 
                            '<p class="text-muted"><i class="fas fa-times text-danger"></i> 无光谱数据</p>'}
                    </div>
                </div>
                
                ${rock.description ? `
                <div class="card mt-3">
                    <div class="card-header">描述</div>
                    <div class="card-body">
                        <p>${rock.description}</p>
                    </div>
                </div>` : ''}
                
                ${rock.mineral_composition ? `
                <div class="card mt-3">
                    <div class="card-header">矿物组成</div>
                    <div class="card-body">
                        <p>${rock.mineral_composition}</p>
                    </div>
                </div>` : ''}
            </div>
        </div>
    `;
    
    modalBody.innerHTML = detailHtml;
    
    // 显示模态框
    const modal = new bootstrap.Modal(document.getElementById('detailModal'));
    modal.show();
}

// 添加到对比列表
function addToCompare(rockId) {
    const rock = rockData.find(r => r.id === rockId);
    if (!rock) return;
    
    // 检查是否已在列表中
    if (compareList.includes(rockId)) {
        showAlert('该样本已在对比列表中', 'warning');
        return;
    }
    
    // 检查是否有光谱数据
    if (!rock.spectrum) {
        showAlert('该样本没有光谱数据，无法对比', 'warning');
        return;
    }
    
    // 添加到列表
    compareList.push(rockId);
    
    // 更新对比列表显示
    updateCompareList();
    
    // 启用对比按钮
    document.getElementById('compare-btn').disabled = false;
    
    showAlert(`已添加 ${rock.id || rock.sample_id} 到对比列表`, 'success');
}

// 更新对比列表显示
function updateCompareList() {
    const container = document.getElementById('compare-list');
    
    if (compareList.length === 0) {
        container.innerHTML = '<p class="text-muted small">点击样本的"对比"按钮添加</p>';
        return;
    }
    
    let html = '';
    compareList.forEach(rockId => {
        const rock = rockData.find(r => r.id === rockId);
        if (rock) {
            html += `
                <div class="compare-item">
                    <span class="small">${rock.id || rock.sample_id}</span>
                    <button class="btn btn-sm btn-outline-danger" onclick="removeFromCompare('${rockId}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        }
    });
    
    container.innerHTML = html;
}

// 从对比列表移除
function removeFromCompare(rockId) {
    compareList = compareList.filter(id => id !== rockId);
    updateCompareList();
    
    if (compareList.length === 0) {
        document.getElementById('compare-btn').disabled = true;
    }
}

// 清空对比列表
document.getElementById('clear-compare').addEventListener('click', function() {
    compareList = [];
    updateCompareList();
    document.getElementById('compare-btn').disabled = true;
    showAlert('已清空对比列表', 'info');
});

// 对比光谱
document.getElementById('compare-btn').addEventListener('click', function() {
    if (compareList.length < 2) {
        showAlert('请至少选择2个样本进行对比', 'warning');
        return;
    }
    
    // 确保所有对比样本都有光谱数据
    const missingSpectra = compareList.filter(id => {
        const rock = rockData.find(r => r.id === id);
        return !rock?.spectrum;
    });
    
    if (missingSpectra.length > 0) {
        showAlert('部分对比样本没有光谱数据', 'error');
        return;
    }
    
    // 加载所有对比样本的光谱数据
    const loadPromises = compareList.map(id => {
        const rock = rockData.find(r => r.id === id);
        return new Promise((resolve) => {
            if (chartData[id]) {
                resolve();
            } else {
                loadSpectrumData(rock).then(resolve);
            }
        });
    });
    
    Promise.all(loadPromises).then(() => {
        compareSpectra();
    });
});

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

// 初始化筛选数据
document.addEventListener('DOMContentLoaded', function() {
    filteredData = [...rockData];
    resetFilters();
});
