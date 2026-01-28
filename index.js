const API = "https://jsonplaceholder.typicode.com";
const feed = document.getElementById("feed");
const status = document.getElementById("status");
const searchInput = document.getElementById("searchInput");
const searchMode = document.getElementById("searchMode");
const longPosts = document.getElementById("longPosts");
const hideUser = document.getElementById("hideUser");
const sortByComments = document.getElementById("sortByComments");

const prev = document.getElementById("prev");
const next = document.getElementById("next");
const pageEl = document.getElementById("page");
const modal = document.getElementById("modal");

let posts = [];
let users = [];
let comments = [];

let page = 1;
const limit = 10;

async function init() {
  try {
    status.innerText = "Loading posts...";

    const [p, u, c] = await Promise.all([
      fetch(`${API}/posts`).then(r => r.json()),
      fetch(`${API}/users`).then(r => r.json()),
      fetch(`${API}/comments`).then(r => r.json())
    ]);

    posts = p;
    users = u;
    comments = c;

    status.innerText = "";
    render();
  } catch (err) {
    status.innerText = "Failed to load data";
  }
}
function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
function applySearch(data) {
  const q = searchInput.value.toLowerCase();
  if (!q) return data;

  const mode = searchMode.value;

  return data.filter(p => {
    const author =
      users.find(u => u.id === p.userId)?.name.toLowerCase() || "";

    if (mode === "title") return p.title.includes(q);
    if (mode === "full")
      return (
        p.title.includes(q) ||
        p.body.includes(q) ||
        author.includes(q)
      );

    // fuzzy search
    return q.split("").every(ch => p.title.includes(ch));
  });
}
function render() {
  let data = posts.slice((page - 1) * limit, page * limit);

  data = applySearch(data);

  feed.innerHTML = "";

  if (data.length === 0) {
    feed.innerHTML = "<p>No posts found</p>";
    return;
  }

  data.forEach(p => {
    const div = document.createElement("div");
    div.className = "post";

    if (longPosts.checked && p.body.length > 120) {
      div.classList.add("long");
    }

    div.innerHTML = `
      <h4>${p.title}</h4>
      <p>${p.body.slice(0, 80)}...</p>
    `;

    div.onclick = () => openDetail(p.id);
    feed.appendChild(div);
  });

  pageEl.innerText = `Page ${page}`;
}
async function openDetail(id) {
  modal.classList.remove("hidden");
  modal.innerHTML = "Loading...";

  try {
    const [post, postComments] = await Promise.all([
      fetch(`${API}/posts/${id}`).then(r => r.json()),
      fetch(`${API}/comments?postId=${id}`).then(r => r.json())
    ]);

    const user = users.find(u => u.id === post.userId);

    modal.innerHTML = `
      <div class="modal-content">
        <h2>${post.title}</h2>
        <p>${post.body}</p>
        <h4>Author: ${user.name}</h4>
        <h4>Comments</h4>
        ${postComments.map(c => `<p>💬 ${c.body}</p>`).join("")}
        <button onclick="closeModal()">Close</button>
      </div>
    `;
  } catch {
    modal.innerHTML = "Failed to load post";
  }
}
prev.onclick = () => {
  if (page > 1) {
    page--;
    render();
  }
};

next.onclick = () => {
  page++;
  render();
};

const debouncedRender = debounce(render, 400);

searchInput.addEventListener("input", debouncedRender);
searchMode.addEventListener("change", render);
document.querySelectorAll("input[type=checkbox]").forEach(cb =>
  cb.addEventListener("change", render)
);
init();
// function closeModal() {
//   modal.style.display = "none";
// }
