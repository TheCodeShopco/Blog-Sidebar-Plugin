function checkPageInfo() {
    let pageSlug = window.location.pathname;
    let pageType;

    const slashCount = (pageSlug.match(/\//g) || []).length;

    if (slashCount === 1) {
        pageType = 'page';
    } else if (slashCount === 2) {
        pageType = 'post';
        pageSlug = pageSlug.split('/').slice(0, 2).join('/');
    } else if (slashCount === 0) {
        pageType = 'home';
    }

    pageSlug = pageSlug.replace(/\//g, '');

    return { pageType, pageSlug };
}

function fetchSidebars(pageInfo) {
    const iframe = document.createElement('iframe');
    iframe.src = '/sidebars';
    iframe.style.display = 'none';
    iframe.id = 'blog-sidebar-page';
    iframe.onload = () => moveSidebar(pageInfo);
    document.head.appendChild(iframe);
}

function createSidebarContainer(pageInfo) {
    const { pageType } = pageInfo;
    const aside = document.createElement('aside');
    aside.id = 'sidebar-container';

    const innerDiv = document.createElement('div');
    innerDiv.id = 'sidebar-inner';
    aside.appendChild(innerDiv);

    if (pageType === 'page') {
        const contentCollection = document.querySelector('.content-collection .content');
        if (contentCollection) {
            contentCollection.appendChild(aside);
            console.log('Sidebar added to blog page');
        }
    } else if (pageType === 'post') {
        const blogItemWrapper = document.querySelector('.blog-item-wrapper');
        if (blogItemWrapper) {
            blogItemWrapper.appendChild(aside);
            console.log('Sidebar added to blog post');
        }
    }
}

function checkSidebarValidity(pageInfo) {
    const { pageType, pageSlug } = pageInfo;
    return fetch('/sidebars')
        .then(response => response.text())
        .then(data => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(data, 'text/html');
            const elements = doc.querySelectorAll(`[data-page-url="${pageSlug}"]`);
            for (const element of elements) {
                const dataPageOrPost = element.getAttribute('data-page-or-post');
                if (dataPageOrPost === pageType || dataPageOrPost === 'both') {
                    console.log(`Element with data-page-url ${pageSlug} and matching data-page-or-post found.`);
                    return true;
                }
            }
            console.log(`Element with data-page-url ${pageSlug} not found or data-page-or-post does not match.`);
            return false;
        })
        .catch(error => {
            console.error('Error fetching sidebars:', error);
            return false;
        });
}

function moveSidebar(pageInfo) {
    const { pageType, pageSlug } = pageInfo;
    const iframe = document.getElementById('blog-sidebar-page');
    if (iframe) {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
        const elements = iframeDoc.querySelectorAll(`[data-page-url="${pageSlug}"]`);
        for (const element of elements) {
            const dataPageOrPost = element.getAttribute('data-page-or-post');
            if (dataPageOrPost === pageType || dataPageOrPost === 'both') {
                const section = element.closest('section');
                if (section) {
                    const sidebarInner = document.getElementById('sidebar-inner');
                    if (sidebarInner) {
                        sidebarInner.appendChild(section); // Move the section directly
                        console.log('Sidebar moved to the main page.');
                        assignStyles(element);
                        console.log('Sidebar styles assigned.');
                        return;
                    }
                }
            }
        }
    }
}

function assignStyles(inputElement) {
    if (!inputElement) return;

    const sidebarContainer = document.getElementById('sidebar-container');
    const contentCollection = document.querySelector('.content-collection .content');
    const contentCollectionWrapper = document.querySelector('.content-collection .collection-content-wrapper');
    const sidebarSections = document.querySelectorAll('#sidebar-container section');

    if (inputElement.hasAttribute('data-sidebar-width')) {
        const width = inputElement.getAttribute('data-sidebar-width');
        sidebarContainer.style.flexBasis = width;
        if (contentCollectionWrapper) {
            const contentWidth = `calc(100% - ${width})`;
            contentCollectionWrapper.style.flexBasis = contentWidth;
        }
    }

    if (inputElement.hasAttribute('data-sidebar-side')) {
        const side = inputElement.getAttribute('data-sidebar-side');
        contentCollection.style.flexDirection = side === 'right' ? 'row' : 'row-reverse';
    }

    if (inputElement.hasAttribute('data-sidebar-internal-padding')) {
        const padding = inputElement.getAttribute('data-sidebar-internal-padding');
        sidebarSections.forEach(section => {
            section.style.padding = padding;
            section.style.paddingTop = padding;
        });
    }

    if (inputElement.hasAttribute('data-sidebar-rounded-edges')) {
        const borderRadius = inputElement.getAttribute('data-sidebar-rounded-edges');
        sidebarSections.forEach(section => {
            section.style.borderRadius = borderRadius;
        });
    }

    if (inputElement.hasAttribute('data-sidebar-border-style')) {
        const borderStyle = inputElement.getAttribute('data-sidebar-border-style');
        sidebarSections.forEach(section => {
            section.style.border = borderStyle;
        });
    }
}

function initialiseBlogSidebar() {
    const pageInfo = checkPageInfo();
    checkSidebarValidity(pageInfo).then(isValid => {
        if (isValid) {
            createSidebarContainer(pageInfo);
            fetchSidebars(pageInfo);
        }
    });
}

document.addEventListener('DOMContentLoaded', initialiseBlogSidebar);