import { hydrate } from 'svelte';

const pages = import.meta.glob('/src/routes/kb/**/+page.svx', { eager: true });
const source = document.querySelector('meta[name="kb-source"]')?.content;
const page = pages[source];
if (page) hydrate(page.default, { target: document.body });
