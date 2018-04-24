const get_coords_snap_lines = function (uid) {
  const snap_lines = { x: [], y: [] };
  pos_lgds_elem.forEach((v, k) => {
    if (k != uid) {
      snap_lines.y.push([v.bottom, v.top], [v.top, v.bottom]);
      snap_lines.x.push([v.left, v.right], [v.right, v.left]);
    }
  });
  return snap_lines;
};

export {
  get_coords_snap_lines,
}
