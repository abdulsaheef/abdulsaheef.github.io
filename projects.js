#project-list {
  display: grid;
  gap: 2rem;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  margin-top: 2rem;
}

.project {
  background-color: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.project:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 35px rgba(0, 0, 0, 0.15);
}

.project h3 {
  font-size: 1.3rem;
  color: #3D52A0;
  margin-bottom: 0.5rem;
}

.project p {
  font-size: 0.95rem;
  color: #555;
  flex-grow: 1;
}

.project a {
  margin-top: 1rem;
  display: inline-block;
  text-decoration: none;
  color: white;
  background-color: #3D52A0;
  padding: 8px 18px;
  border-radius: 30px;
  font-weight: 500;
  font-size: 0.9rem;
  transition: background 0.3s ease;
}

.project a:hover {
  background-color: #1e2e70;
}

body.dark-mode .project {
  background-color: #3a3e50;
  color: #EDE8F5;
}

body.dark-mode .project p {
  color: #dcdcdc;
}

body.dark-mode .project a {
  background-color: #7091E6;
}

body.dark-mode .project a:hover {
  background-color: #3D52A0;
}