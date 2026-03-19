// app.js - 修复版本

// 等待所有内容加载完成
window.addEventListener('load', function() {
    console.log('页面完全加载完成');
    setTimeout(initApp, 100); // 稍微延迟确保 DOM 完全就绪
});

function initApp() {
    console.log('初始化应用');
    
    // 检查关键 DOM 元素是否存在
    const requiredElements = [
        'rock-type-filter',
        'location-filter',
        'quick-search',
        'sample-count'
    ];
    
    let allElementsExist = true;
    requiredElements.forEach(id => {
        const element = document.getElementById(id);
        console.log(`${id}:`, element ? '找到' : '未找到');
        if (!element) allElementsExist = false;
    });
    
    if (!allElementsExist) {
        console.error('部分关键 DOM 元素未找到');
        setTimeout(initApp, 500); // 如果未找到，稍后重试
        return;
    }
    
    // 初始化应用
    loadRockData()
        .then(() => {
            console.log('数据加载成功');
            initEventListeners();
            // 不要在这里调用 resetFilters，等数据完全准备好
            setTimeout(() => {
                if (typeof resetFilters === 'function') {
                    resetFilters();
                }
            }, 100);
        })
        .catch(error => {
            console.error('初始化失败:', error);
            document.getElementById('sample-count').innerHTML = 
                '<span class="text-danger">初始化失败，请刷新页面</span>';
        });
}

// 修改 loadRockData 函数
async function loadRockData() {
    try {
        console.log('开始加载数据...');
        
        // 显示加载状态
        const sampleCountEl = document.getElementById('sample-count');
        if (sampleCountEl) {
            sampleCountEl.innerHTML = '<span class="spinner"></span> 加载中...';
        }
        
        // 加载数据
        const response = await fetch('rockmanager/rocks.json');
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        rockData = await response.json();
        console.log('成功加载', rockData.length, '条数据');
        
        // 初始化数据
        filteredData = [...rockData];
        processRockData(rockData);
        
        // 更新 UI（确保元素存在）
        updateFilterOptions();
        
        // 更新样本计数
        if (sampleCountEl) {
            sampleCountEl.innerHTML = 
                `<i class="fas fa-database"></i> ${rockData.length} 个样本`;
        }
        
        return rockData;
        
    } catch (error) {
        
        const sampleCountEl = document.getElementById('sample-count');
        if (sampleCountEl) {
            sampleCountEl.innerHTML = 
                `<i class="fas fa-database"></i> ${rockData.length} 个样本（模拟数据）`;
        }
        
        return rockData;
    }
}

// 修改 updateFilterOptions 函数，添加安全检查
function updateFilterOptions() {
    console.log('更新筛选选项...');
    
    const rockTypeFilter = document.getElementById('rock-type-filter');
    const locationFilter = document.getElementById('location-filter');
    
    // 安全检查
    if (!rockTypeFilter || !locationFilter) {
        console.warn('筛选元素未找到，跳过更新');
        return;
    }
    
    // 清空现有选项
    rockTypeFilter.innerHTML = '';
    locationFilter.innerHTML = '<option value="">全部位置</option>';
    
    // 添加岩性选项
    if (rockTypes && rockTypes.size > 0) {
        rockTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            rockTypeFilter.appendChild(option);
        });
    }
    
    // 添加位置选项
    if (locations && locations.size > 0) {
        locations.forEach(location => {
            const option = document.createElement('option');
            option.value = location;
            option.textContent = location;
            locationFilter.appendChild(option);
        });
    }
    
    console.log('筛选选项更新完成');
}

// 全局变量声明
let rockData = [];
let filteredData = [];
let currentPage = 1;
const itemsPerPage = 12;
let rockTypes = new Set();
let locations = new Set();
let compareList = [];

// 处理岩石数据
function processRockData(data) {
    console.log('处理岩石数据...');
    
    rockTypes.clear();
    locations.clear();
    
    data.forEach(rock => {
        if (rock.rock_type) rockTypes.add(rock.rock_type);
        if (rock.location) locations.add(rock.location);
    });
    
    console.log('发现岩性种类:', Array.from(rockTypes));
    console.log('发现位置:', Array.from(locations));
}

// 更新筛选选项
function updateFilterOptions() {
    const rockTypeFilter = document.getElementById('rock-type-filter');
    const locationFilter = document.getElementById('location-filter');
    
    // 清空现有选项
    rockTypeFilter.innerHTML = '';
    locationFilter.innerHTML = '<option value="">全部位置</option>';
    
    // 添加岩性选项
    rockTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type;
        option.textContent = type;
        rockTypeFilter.appendChild(option);
    });
    
    // 添加位置选项
    locations.forEach(location => {
        const option = document.createElement('option');
        option.value = location;
        option.textContent = location;
        locationFilter.appendChild(option);
    });
    
    // 更新样本计数
    document.getElementById('sample-count').innerHTML = 
        `<i class="fas fa-database"></i> ${rockData.length} 个样本`;
}

// 显示结果
function displayResults() {
    const viewType = document.getElementById('toggle-view').dataset.view || 'grid';
    
    if (viewType === 'list') {
        displayListView();
    } else {
        displayGridView();
    }
    
    updatePagination();
}

// 网格视图
function displayGridView() {
    const container = document.getElementById('rock-grid');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);
    
    container.innerHTML = '';
    
    pageData.forEach(rock => {
        const card = createRockCard(rock);
        container.appendChild(card);
    });
}

// 列表视图
function displayListView() {
    const container = document.getElementById('rock-table');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);
    
    container.innerHTML = '';
    
    pageData.forEach(rock => {
        const row = createTableRow(rock);
        container.appendChild(row);
    });
}

// 创建岩石卡片
function createRockCard(rock) {
    const col = document.createElement('div');
    col.className = 'col-lg-3 col-md-4 col-sm-6 mb-4';
    
    col.innerHTML = `
        <div class="card rock-card h-100" data-id="${rock.id}">
            <div class="position-relative">
                <img src="images/rocks/${rock.image}" 
                     class="card-img-top rock-image" 
                     alt="${rock.rock_type || '岩石样本'}"
                     onerror="this.src='images/rocks/default.jpg'">
                <span class="rock-badge badge" 
                    style="background-color: ${getRockTypeColor(rock.rock_type)}; color: white;">
                    ${rock.rock_type || '未知'}
                </span>
            </div>
            <div class="card-body">
                <h6 class="card-title">${rock.sample_id || rock.id}</h6>
                <p class="card-text small">
                    <i class="fas fa-map-marker-alt"></i> ${rock.location || '未知位置'}<br>
                    <i class="fas fa-clock"></i> ${rock.formation_age || '未知时代'}
                </p>
            </div>
            <div class="card-footer bg-white border-0 pt-0">
                <div class="btn-group w-100">
                    <button class="btn btn-sm btn-outline-primary view-detail" data-id="${rock.id}">
                        <i class="fas fa-eye"></i> 详情
                    </button>
                    <button class="btn btn-sm btn-outline-success view-spectrum" data-id="${rock.id}">
                        <i class="fas fa-chart-line"></i> 光谱
                    </button>
                    <button class="btn btn-sm btn-outline-info add-compare" data-id="${rock.id}">
                        <i class="fas fa-plus"></i> 对比
                    </button>
                </div>
            </div>
        </div>
    `;
    
    return col;
}

// 创建表格行
function createTableRow(rock) {
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td><strong>${rock.sample_id || rock.id}</strong></td>
        <td><span class="badge" 
            style="background-color: ${getRockTypeColor(rock.rock_type)}; color: white;">${rock.rock_type || '未知'}</span></td>
        <td>${rock.location || '未知'}</td>
        <td>${rock.formation_age || '未知'}</td>
        <td>
            <span class="badge bg-light text-dark">
                <i class="fas fa-wave-square"></i> ${rock.spectrum ? '有光谱' : '无光谱'}
            </span>
        </td>
        <td>
            <button class="btn btn-sm btn-outline-primary view-detail" data-id="${rock.id}">
                <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-sm btn-outline-success view-spectrum" data-id="${rock.id}">
                <i class="fas fa-chart-line"></i>
            </button>
            <button class="btn btn-sm btn-outline-info add-compare" data-id="${rock.id}">
                <i class="fas fa-plus"></i>
            </button>
        </td>
    `;
    
    return row;
}

// 根据岩性获取颜色
function getRockTypeColor(rockType) {
    const colorMap = {
        '侵入岩': '#0d6efd',
        '喷出岩': '#6c757d',
        '碎屑岩': '#198754',
        '化学沉积岩': '#0dcaf0',
        '区域变质岩': '#ffc107',
        '接触变质岩': '#dc3545',
        '其他岩性': '#6610f2'
    };
    
    return colorMap[rockType] || '#212529';
}

// 更新分页
function updatePagination() {
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const container = document.getElementById('pagination-container');
    const ul = container.querySelector('.pagination');
    
    if (totalPages <= 1) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    ul.innerHTML = '';
    
    // 上一页
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" data-page="${currentPage - 1}">上一页</a>`;
    ul.appendChild(prevLi);
    
    // 页码
    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
        ul.appendChild(li);
    }
    
    // 下一页
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" data-page="${currentPage + 1}">下一页</a>`;
    ul.appendChild(nextLi);
    
    // 更新结果计数
    document.getElementById('result-count').textContent = 
        `第 ${currentPage}/${totalPages} 页，共 ${filteredData.length} 个结果`;
}

// 更新统计信息
function updateStats() {
    const stats = document.getElementById('filter-stats');
    const rockTypeCount = new Set(filteredData.map(r => r.rock_type)).size;
    const locationCount = new Set(filteredData.map(r => r.location)).size;
    
    stats.innerHTML = `
        筛选结果: <strong>${filteredData.length}</strong> 个样本<br>
        岩性种类: <strong>${rockTypeCount}</strong> 种<br>
        采样位置: <strong>${locationCount}</strong> 处
    `;
}

// 初始化事件监听
function initEventListeners() {
    // 搜索按钮
    document.getElementById('search-btn').addEventListener('click', applyFilters);
    document.getElementById('quick-search').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') applyFilters();
    });
    
    // 筛选应用
    document.getElementById('apply-filter').addEventListener('click', applyFilters);
    document.getElementById('reset-filter').addEventListener('click', resetFilters);
    
    // 视图切换
    document.getElementById('toggle-view').addEventListener('click', toggleView);
    
    // 分页点击
    document.getElementById('pagination-container').addEventListener('click', function(e) {
        if (e.target.tagName === 'A') {
            e.preventDefault();
            const page = parseInt(e.target.dataset.page);
            if (page && page !== currentPage) {
                currentPage = page;
                displayResults();
            }
        }
    });
    
    // 委托事件处理（动态生成的元素）
    document.addEventListener('click', function(e) {
        // 查看详情
        if (e.target.closest('.view-detail')) {
            const id = e.target.closest('.view-detail').dataset.id;
            showDetail(id);
        }
        
        // 查看光谱
        if (e.target.closest('.view-spectrum')) {
            const id = e.target.closest('.view-spectrum').dataset.id;
            const rock = rockData.find(r => r.id === id);
            if (rock) loadSpectrumData(rock);
        }
        
        // 添加到对比
        if (e.target.closest('.add-compare')) {
            const id = e.target.closest('.add-compare').dataset.id;
            addToCompare(id);
        }
    });
}
