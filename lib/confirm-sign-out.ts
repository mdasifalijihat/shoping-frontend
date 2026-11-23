export async function confirmSignOut() {
  const { default: Swal } = await import("sweetalert2");
  const result = await Swal.fire({
    title: "Sign out?",
    text: "Are you sure you want to sign out?",
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Sign out",
    cancelButtonText: "Cancel",
    focusCancel: true,
  });

  return result.isConfirmed;
}
