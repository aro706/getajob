
const RecruiterDashboard = () => {
    const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
    };
  return (
    <div className="p-8">
      <h1 className="text-3xl font-cinzel text-dune-spice mb-4">Recruiter Command</h1>
      <p className="text-dune-tan mb-4">Review the spice flow (Candidate Buckets).</p>
      <button onClick={logout} className="text-dune-spice underline cursor-pointer">Sever Connection (Logout)</button>
    </div>
  );
};

export default RecruiterDashboard;