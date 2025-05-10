package com.example.para_mobile.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.para_mobile.R
import com.example.para_mobile.model.RecentRoute

class RecentRouteAdapter(
    private val items: List<RecentRoute>,
    private val onClick: (RecentRoute) -> Unit
) : RecyclerView.Adapter<RecentRouteAdapter.ViewHolder>() {
    class ViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val textView: TextView = view.findViewById(R.id.recent_location_name)
    }
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val v = LayoutInflater.from(parent.context).inflate(R.layout.item_recent_location, parent, false)
        return ViewHolder(v)
    }
    override fun getItemCount() = items.size
    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        val item = items[position]
        holder.textView.text = item.destName
        holder.itemView.setOnClickListener { onClick(item) }
    }
} 