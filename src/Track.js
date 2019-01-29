import ReactGA from 'react-ga';

ReactGA.initialize('UA-15758173-59');

function event(args) {
    if (window.location.hostname === 'localhost') {
        return;
    }

    ReactGA.event(args)
}

function pageview() {
    if (window.location.hostname === 'localhost') {
        return;
    }

    ReactGA.pageview(window.location.pathname + window.location.search);
}

export { event, pageview }

    