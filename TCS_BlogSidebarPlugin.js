// Function to check the page and return the url slug and check the type of page user is on //

function checkPageInfo() {
    let pageSlug = window.location.pathname;
    let pageType;

    // Getting the number of '/' characters in the url //
    const slashCount = (pageSlug.match(/\//g) || []).length;

    // If page has an extra '/', we know it is not a blog page, but a post //
    if (slashCount === 1) {
        pageType = 'page';
    } else if (slashCount === 2) {
        pageType = 'post';
        pageSlug = pageSlug.split('/').slice(0, 2).join('/');
    } else if (slashCount === 0) {
        pageType = 'home';
    }

    // removing the '/' characters from the url to save as a variable //
    pageSlug = pageSlug.replace(/\//g, '');

    return { pageType, pageSlug };
}

// Function to fetch the sidebars page and add it to the current page in an iFrame to ensure functions remain, while also finding the right sidebar and moving it //

function fetchSidebars(pageInfo) {
    const iframe = document.createElement('iframe');
    iframe.src = '/sidebars';
    iframe.style.display = 'none';
    iframe.id = 'blog-sidebar-page';
    iframe.onload = () => moveSidebar(pageInfo);
    document.head.appendChild(iframe);
}

// Function to create the sidebar container on the blog page //

function createSidebarContainer(pageInfo) {
    const { pageType } = pageInfo;
    const aside = document.createElement('aside');
    aside.id = 'sidebar-container';

    const innerDiv = document.createElement('div');
    innerDiv.id = 'sidebar-inner';
    aside.appendChild(innerDiv);

    // Adding the sidebar to the page, and also adding a class to a specific blog type to fix an issue //
    const contentCollection = document.querySelector('.content-collection .content');
        if (contentCollection) {
            contentCollection.appendChild(aside);
            let blogType = contentCollection.querySelectorAll('*');
            blogType.forEach(element => {
                if (element.classList.contains('blog-alternating-side-by-side')) {
                    element.classList.add('collection-content-wrapper');
                }
            })
        }
}

// Fucntion to check whether there is a valid sidebar for the current page //

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
                    return true;
                }
            }
            document.querySelector('main').style.opacity = 1;
            return false;
        })
        .catch(error => {
            return false;
        });
}

// Function that moves the sidebar from the iFrame into the sidebar container //

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
                    section.classList.remove('page-section');
                    const sidebarInner = document.getElementById('sidebar-inner');
                    if (sidebarInner) {
                        sidebarInner.appendChild(section);
                        assignStyles(element);
                        return;
                    }
                }
            }
        }
    }
}

// Function to assign all the styles selected in the sidebar code block //

function assignStyles(inputElement) {

    if (!inputElement) return;

    const { pageType } = checkPageInfo();
    const sidebarContainer = document.getElementById('sidebar-container');
    const sidebarSections = document.querySelectorAll('#sidebar-container section');
    const contentCollection = document.querySelector('.content-collection .content');
    const contentCollectionWrapper = document.querySelector('.content-collection .collection-content-wrapper');
    const blogItemWrapper = document.querySelector('.blog-item-wrapper');
    const article = document.querySelector('.blog-item-wrapper article');
    const blogItemInner = document.querySelector('.blog-item-wrapper article .blog-item-inner-wrapper');

    contentCollection.classList.add('blog-sidebar-layout-active');
    
    if (pageType === 'page') {
        contentCollectionWrapper.classList.add('blog-sidebar-padding-active');    
    }

    if (pageType === 'post') {
        article.classList.add('blog-sidebar-padding-active')
        blogItemInner.classList.add('blog-sidebar-post-layout-active');
    }

    if (inputElement.hasAttribute('data-sidebar-width')) {
        const width = inputElement.getAttribute('data-sidebar-width');
        sidebarContainer.style.flexBasis = width;
        const contentWidth = `calc(100% - ${width})`;
        if (contentCollectionWrapper) {
            contentCollectionWrapper.style.flexBasis = contentWidth;
            }
        if (blogItemWrapper) { {
            blogItemWrapper.style.flexBasis = contentWidth;
            }
        }
    }
    
    if (inputElement.hasAttribute('data-sidebar-side')) {
        const side = inputElement.getAttribute('data-sidebar-side');
        contentCollection.style.flexDirection = side === 'right' ? 'row' : 'row-reverse';
        if (side === 'left') {
            sidebarContainer.classList.add('sidebar-position-left');
        }
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

    if (inputElement.hasAttribute('data-sidebar-sticky')) {
        const sticky = inputElement.getAttribute('data-sidebar-sticky');
        if (sticky === 'true') {
            sidebarSections.forEach(section => {
                section.style.position = 'sticky';
            });
        } else {
            sidebarSections.forEach(section => {
                section.style.position = 'relative';
            });
        }
    }

    if (inputElement.hasAttribute('data-sidebar-sticky-offset')) {
        const stickyOffset = inputElement.getAttribute('data-sidebar-sticky-offset');
        sidebarSections.forEach(section => {
            section.style.top = stickyOffset;
        });
    }

}

// Initialisation function to call all the functions in the right order //

function initialiseBlogSidebar() {
    const pageInfo = checkPageInfo();
    checkSidebarValidity(pageInfo).then(isValid => {
        if (isValid) {
            createSidebarContainer(pageInfo);
            fetchSidebars(pageInfo).then(() => {
            });
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('main').style.opacity = 0;
    initialiseBlogSidebar().then(() => {
        document.querySelector('main').style.opacity = 1;
    });
});